from decimal import Decimal
import re
from zoneinfo import ZoneInfo

from django.db import models
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


def _format_npr_amount(amount_paisa):
    return f"NPR {Decimal(amount_paisa) / Decimal('100')}"


def _get_related_ticket_group(ticket, organizer):
    return list(
        Ticket.objects.select_related('concert', 'attendee', 'ticket_category', 'payment_transaction')
        .filter(
            concert__organizer=organizer,
            attendee=ticket.attendee,
            concert=ticket.concert,
            ticket_category=ticket.ticket_category,
        )
        .order_by('payment_transaction__created_at', 'created_at', 'id')
    )


def _build_ticket_group_data(pin_token, tickets):
    primary_ticket = tickets[0]
    primary_payment = primary_ticket.payment_transaction
    attendee_name = primary_ticket.attendee.get_full_name() or primary_ticket.attendee.username or primary_ticket.attendee.email
    total_ticket_counts_by_payment = {
        str(row['payment_transaction_id']): row['total']
        for row in Ticket.objects.filter(payment_transaction_id__in=[ticket.payment_transaction_id for ticket in tickets])
        .values('payment_transaction_id')
        .annotate(total=models.Count('id'))
    }

    unique_payments = []
    seen_payment_ids = set()
    quantities_by_payment = {}
    for ticket in tickets:
        payment = ticket.payment_transaction
        if not payment:
            continue
        payment_id = str(payment.id)
        quantities_by_payment[payment_id] = quantities_by_payment.get(payment_id, 0) + 1
        if payment_id in seen_payment_ids:
            continue
        seen_payment_ids.add(payment_id)
        unique_payments.append(payment)

    total_booking_quantity = 0
    booked_at = ' | '.join(
        filter(None, (_format_nepal_datetime(payment.created_at) for payment in unique_payments))
    ) or _format_nepal_datetime(primary_ticket.created_at)
    total_amount_paisa = Decimal('0')

    for payment in unique_payments:
        payment_id = str(payment.id)
        matched_ticket_count = quantities_by_payment.get(payment_id, 0)
        issued_ticket_count = total_ticket_counts_by_payment.get(payment_id, 0)

        # Handle legacy rows where a multi-quantity booking ended up with a single ticket row.
        if issued_ticket_count <= 1 and payment.quantity > 1:
            total_booking_quantity += payment.quantity
            total_amount_paisa += Decimal(payment.amount_paisa)
            continue

        effective_quantity = matched_ticket_count or 0
        unit_amount_paisa = Decimal(payment.amount_paisa) / Decimal(payment.quantity or effective_quantity or 1)
        total_booking_quantity += effective_quantity
        total_amount_paisa += unit_amount_paisa * effective_quantity

    return {
        'token': pin_token,
        'attendee_name': attendee_name,
        'attendee_email': primary_ticket.attendee.email,
        'concert_title': primary_ticket.concert.title,
        'concert_date_time': _format_nepal_datetime(primary_ticket.concert.date_time),
        'concert_venue': primary_ticket.concert.venue,
        'ticket_type': (
            primary_payment.ticket_category_name_display
            if primary_payment
            else primary_ticket.ticket_category.name
        ),
        'booked_at': booked_at,
        'total_booking_quantity': total_booking_quantity,
        'total_amount': _format_npr_amount(total_amount_paisa),
    }


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

    return Response(
        {
            'success': False,
            'message': 'Issued tickets are preserved for booking history and cannot be deleted.',
        },
        status=status.HTTP_409_CONFLICT,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizer])
def verify_ticket(request):
    pin_token = (request.data.get('qr_token') or '').strip()
    confirm_entry = bool(request.data.get('confirm_entry'))
    if not re.fullmatch(r'\d{4}', pin_token):
        return Response({'detail': 'A valid 4-digit PIN is required.'}, status=status.HTTP_400_BAD_REQUEST)

    ticket = (
        Ticket.objects.select_related('concert', 'attendee', 'ticket_category', 'payment_transaction')
        .filter(concert__organizer=request.user)
        .filter(token_pin=pin_token)
        .order_by('created_at')
        .first()
    )
    if not ticket:
        return Response({'detail': 'Invalid PIN.'}, status=status.HTTP_404_NOT_FOUND)
    related_tickets = _get_related_ticket_group(ticket, request.user)
    ticket_data = _build_ticket_group_data(pin_token, related_tickets)
    total_booking_quantity = ticket_data['total_booking_quantity']
    unused_tickets = [item for item in related_tickets if not item.is_used]
    remaining_booking_quantity = (
        _build_ticket_group_data(pin_token, unused_tickets)['total_booking_quantity'] if unused_tickets else 0
    )
    used_booking_quantity = max(total_booking_quantity - remaining_booking_quantity, 0)

    if remaining_booking_quantity == 0:
        return Response(
            {
                'success': False,
                'message': 'Ticket already used.' if total_booking_quantity == 1 else 'These tickets are already used.',
                'data': ticket_data,
            },
            status=status.HTTP_200_OK,
        )

    if not confirm_entry:
        return Response(
            {
                'success': True,
                'message': (
                    'PIN is valid. Please confirm entry to mark this ticket as used.'
                    if remaining_booking_quantity == total_booking_quantity == 1
                    else 'PIN is valid. Please confirm entry to mark these tickets as used.'
                    if remaining_booking_quantity == total_booking_quantity
                    else (
                        f'{used_booking_quantity} of {total_booking_quantity} tickets already used. '
                        f'Please confirm entry to mark the remaining {remaining_booking_quantity} '
                        f"{'ticket' if remaining_booking_quantity == 1 else 'tickets'} as used."
                    )
                ),
                'data': ticket_data,
                'requires_confirmation': True,
            },
            status=status.HTTP_200_OK,
        )

    confirmed_at = timezone.now()
    Ticket.objects.filter(id__in=[item.id for item in unused_tickets]).update(
        is_used=True,
        used_at=confirmed_at,
        used_by_id=request.user.id,
    )

    return Response(
        {
            'success': True,
            'message': (
                'Ticket is valid. Entry granted.'
                if remaining_booking_quantity == total_booking_quantity == 1
                else f'Entry granted for {total_booking_quantity} tickets.'
                if remaining_booking_quantity == total_booking_quantity
                else (
                    'Entry granted for the remaining ticket.'
                    if remaining_booking_quantity == 1
                    else f'Entry granted for the remaining {remaining_booking_quantity} tickets.'
                )
            ),
            'data': ticket_data,
        },
        status=status.HTTP_200_OK,
    )
