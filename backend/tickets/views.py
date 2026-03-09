from decimal import Decimal
import re
from zoneinfo import ZoneInfo

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAttendee, IsOrganizer
from payments.models import PaymentTransaction
from tickets.models import Ticket
from .serializers import OrganizerBookingSerializer, TicketSerializer

NEPAL_TZ = ZoneInfo('Asia/Kathmandu')


def _format_nepal_datetime(value):
    if not value:
        return ''
    localized = timezone.localtime(value, NEPAL_TZ)
    return localized.strftime('%Y-%m-%d %H:%M:%S')


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
    pin_token = (request.data.get('qr_token') or '').strip()
    confirm_entry = bool(request.data.get('confirm_entry'))
    if not re.fullmatch(r'\d{4}', pin_token):
        return Response({'detail': 'A valid 4-digit PIN is required.'}, status=status.HTTP_400_BAD_REQUEST)

    matched_tickets = list(
        Ticket.objects.select_related('concert', 'attendee', 'ticket_category', 'payment_transaction')
        .filter(concert__organizer=request.user)
        .filter(token_pin=pin_token)
        .order_by('created_at')
    )
    if not matched_tickets:
        return Response({'detail': 'Invalid PIN.'}, status=status.HTTP_404_NOT_FOUND)
    if len(matched_tickets) > 1:
        return Response(
            {'detail': 'PIN matches multiple tickets. Please contact support.'},
            status=status.HTTP_409_CONFLICT,
        )
    ticket = matched_tickets[0]

    attendee_name = ticket.attendee.get_full_name() or ticket.attendee.username or ticket.attendee.email
    payment = ticket.payment_transaction
    total_booking_quantity = payment.quantity
    ticket_data = {
        'token': ticket.token_pin,
        'attendee_name': attendee_name,
        'attendee_email': ticket.attendee.email,
        'concert_title': ticket.concert.title,
        'concert_date_time': _format_nepal_datetime(ticket.concert.date_time),
        'concert_venue': ticket.concert.venue,
        'ticket_type': ticket.ticket_category.name,
        'booked_at': _format_nepal_datetime(ticket.created_at),
        'total_booking_quantity': total_booking_quantity,
        'total_amount': f"NPR {Decimal(payment.amount_paisa) / Decimal('100')}",
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

    if not confirm_entry:
        return Response(
            {
                'success': True,
                'message': 'PIN is valid. Please confirm entry to mark this ticket as used.',
                'data': ticket_data,
                'requires_confirmation': True,
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
            'data': ticket_data,
        },
        status=status.HTTP_200_OK,
    )
