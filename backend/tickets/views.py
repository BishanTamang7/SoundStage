from decimal import Decimal

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAttendee, IsOrganizer
from payments.models import PaymentTransaction
from tickets.models import Ticket
from .serializers import OrganizerBookingSerializer, TicketSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAttendee])
def my_tickets(request):
    queryset = (
        Ticket.objects.select_related('concert', 'ticket_category', 'attendee', 'payment_transaction')
        .filter(attendee=request.user)
        .order_by('-created_at')
    )
    grouped_by_booking = []
    seen_booking_ids = set()
    for ticket in queryset:
        booking_id = str(ticket.payment_transaction_id)
        if booking_id in seen_booking_ids:
            continue
        seen_booking_ids.add(booking_id)
        grouped_by_booking.append(ticket)

    serializer = TicketSerializer(grouped_by_booking, many=True)
    return Response({'success': True, 'data': {'tickets': serializer.data}}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizer])
def organizer_bookings(request):
    queryset = (
        PaymentTransaction.objects.select_related('attendee', 'concert', 'ticket_category')
        .filter(concert__organizer=request.user, status='Completed', tickets_issued=True)
        .order_by('-created_at')
    )
    serializer = OrganizerBookingSerializer(queryset, many=True)
    return Response({'success': True, 'data': {'bookings': serializer.data}}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsAttendee])
def delete_my_ticket(request, ticket_id):
    ticket = Ticket.objects.filter(id=ticket_id, attendee=request.user).first()
    if not ticket:
        return Response({'detail': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

    ticket.delete()
    return Response(
        {
            'success': True,
            'message': 'Ticket deleted successfully.',
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizer])
def verify_ticket(request):
    qr_token = (request.data.get('qr_token') or '').strip()
    if ':' in qr_token:
        prefix, possible_token = qr_token.split(':', 1)
        if prefix.strip().upper() == 'SOUNDSTAGE':
            qr_token = possible_token.strip().splitlines()[0].strip()

    if not qr_token:
        return Response({'detail': 'qr_token is required.'}, status=status.HTTP_400_BAD_REQUEST)

    ticket = (
        Ticket.objects.select_related('concert', 'attendee', 'ticket_category', 'payment_transaction')
        .filter(qr_token=qr_token)
        .first()
    )
    if not ticket:
        return Response({'detail': 'Invalid QR code.'}, status=status.HTTP_404_NOT_FOUND)

    if ticket.concert.organizer_id != request.user.id:
        return Response({'detail': 'You cannot validate tickets for this concert.'}, status=status.HTTP_403_FORBIDDEN)

    attendee_name = ticket.attendee.get_full_name() or ticket.attendee.username or ticket.attendee.email
    payment = ticket.payment_transaction
    ticket_data = {
        'ticket_id': str(ticket.id),
        'qr_value': f'SOUNDSTAGE:{ticket.qr_token}',
        'concert_title': ticket.concert.title,
        'concert_date_time': ticket.concert.date_time,
        'concert_venue': ticket.concert.venue,
        'ticket_type': ticket.ticket_category.name,
        'seat_number': ticket.seat_number,
        'attendee_name': attendee_name,
        'attendee_email': ticket.attendee.email,
        'booked_at': ticket.created_at,
        'booking_id': str(payment.id),
        'booking_quantity': payment.quantity,
        'booking_total_paisa': payment.amount_paisa,
        'booking_total_rupees': str(Decimal(payment.amount_paisa) / Decimal('100')),
        'is_used': ticket.is_used,
        'used_at': ticket.used_at,
    }

    if ticket.is_used:
        return Response(
            {
                'success': False,
                'message': 'Ticket already used.',
                'data': ticket_data,
            },
            status=status.HTTP_200_OK,
        )

    ticket.is_used = True
    ticket.used_at = timezone.now()
    ticket.used_by = request.user
    ticket.save(update_fields=['is_used', 'used_at', 'used_by'])

    return Response(
        {
            'success': True,
            'message': 'Ticket is valid. Entry granted.',
            'data': {
                **ticket_data,
                'is_used': ticket.is_used,
                'used_at': ticket.used_at,
                'validated_at': ticket.used_at,
            },
        },
        status=status.HTTP_200_OK,
    )
