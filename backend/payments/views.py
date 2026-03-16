import json
import logging
import secrets
import uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import timedelta
from urllib import error as url_error
from urllib import request as url_request

from django.conf import settings
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone
from django.utils.timezone import localtime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsAttendee
from events.models import Concert
from payments.models import PaymentTransaction
from notifications.models import NotificationPreference
from tickets.models import Ticket, TicketCategory
from tickets.serializers import TicketSerializer

logger = logging.getLogger(__name__)

RESERVATION_TIMEOUT_MINUTES = 15
PLACEHOLDER_PIDX_PREFIX = 'INIT-'
TERMINAL_FAILED_STATUS_KEYWORDS = ('cancel', 'abandon', 'fail', 'expire', 'void')


def _generate_token_pin(used_pins=None) -> str:
    used = used_pins if used_pins is not None else set()
    for _ in range(2000):
        candidate = f'{secrets.randbelow(10000):04d}'
        if candidate in used:
            continue
        if Ticket.objects.filter(token_pin=candidate).exists():
            continue
        used.add(candidate)
        return candidate
    raise ValueError('Could not allocate unique token pin.')


def _normalize_payment_status(value) -> str:
    return str(value or '').strip().lower()


def _is_completed_status(value) -> bool:
    return _normalize_payment_status(value) == 'completed'


def _is_terminal_unsuccessful_status(value) -> bool:
    normalized = _normalize_payment_status(value)
    return any(keyword in normalized for keyword in TERMINAL_FAILED_STATUS_KEYWORDS)


def _khalti_request(path: str, payload: dict):
    secret_key = settings.KHALTI_SECRET_KEY
    if not secret_key:
        return {
            'ok': False,
            'status': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'data': {'detail': 'Khalti secret key is not configured on server.'},
        }

    base_url = settings.KHALTI_BASE_URL.rstrip('/')
    url = f'{base_url}{path}'

    req = url_request.Request(
        url=url,
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Authorization': f'Key {secret_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    try:
        with url_request.urlopen(req, timeout=20) as response:
            body = response.read().decode('utf-8')
            parsed = json.loads(body) if body else {}
            return {'ok': True, 'status': response.status, 'data': parsed}
    except url_error.HTTPError as exc:
        body = exc.read().decode('utf-8') if exc.fp else ''
        try:
            parsed = json.loads(body) if body else {}
        except json.JSONDecodeError:
            parsed = {'detail': body or 'Khalti request failed.'}
        return {'ok': False, 'status': exc.code, 'data': parsed}
    except (url_error.URLError, TimeoutError):
        return {
            'ok': False,
            'status': status.HTTP_502_BAD_GATEWAY,
            'data': {'detail': 'Could not reach Khalti service.'},
        }


def _sync_payment_from_lookup(payment: PaymentTransaction, lookup_data: dict):
    status_value = lookup_data.get('status') or payment.status
    transaction_id = lookup_data.get('transaction_id') or payment.transaction_id
    reservation_expired = bool(
        payment.stock_reserved
        and payment.reservation_expires_at
        and payment.reservation_expires_at <= timezone.now()
    )

    if payment.stock_reserved and (
        _is_terminal_unsuccessful_status(status_value)
        or (reservation_expired and not _is_completed_status(status_value))
    ):
        return _release_stock_reservation(
            payment,
            status_value=status_value,
            transaction_id=transaction_id,
            raw_response=lookup_data,
        )

    payment.status = status_value
    payment.transaction_id = transaction_id
    payment.raw_response = lookup_data
    payment.save(update_fields=['status', 'transaction_id', 'raw_response', 'updated_at'])
    return payment


def _create_reserved_payment(*, attendee, concert, ticket_category, purchase_order_id, amount_paisa, quantity):
    reservation_expires_at = timezone.now() + timedelta(minutes=RESERVATION_TIMEOUT_MINUTES)
    placeholder_pidx = f'{PLACEHOLDER_PIDX_PREFIX}{uuid.uuid4().hex}'

    with transaction.atomic():
        category = TicketCategory.objects.select_for_update().get(id=ticket_category.id)
        if category.quantity < quantity:
            raise ValueError('Requested quantity exceeds available tickets.')

        category.quantity -= quantity
        category.save(update_fields=['quantity'])

        return PaymentTransaction.objects.create(
            attendee=attendee,
            concert=concert,
            ticket_category=category,
            pidx=placeholder_pidx,
            purchase_order_id=purchase_order_id,
            amount_paisa=amount_paisa,
            quantity=quantity,
            status='Initiated',
            stock_reserved=True,
            reservation_expires_at=reservation_expires_at,
            ticket_category_name_snapshot=category.name,
            ticket_unit_price_snapshot=category.price,
        )


def _release_stock_reservation(payment, *, status_value=None, transaction_id=None, raw_response=None):
    with transaction.atomic():
        locked_payment = PaymentTransaction.objects.select_for_update().get(id=payment.id)
        category = TicketCategory.objects.select_for_update().get(id=locked_payment.ticket_category_id)
        update_fields = []

        if locked_payment.stock_reserved and not locked_payment.tickets_issued:
            category.quantity += locked_payment.quantity
            category.save(update_fields=['quantity'])
            locked_payment.stock_reserved = False
            locked_payment.reservation_expires_at = None
            update_fields.extend(['stock_reserved', 'reservation_expires_at'])

        if status_value and locked_payment.status != status_value:
            locked_payment.status = status_value
            update_fields.append('status')
        if transaction_id and locked_payment.transaction_id != transaction_id:
            locked_payment.transaction_id = transaction_id
            update_fields.append('transaction_id')
        if raw_response is not None:
            locked_payment.raw_response = raw_response
            update_fields.append('raw_response')

        if update_fields:
            locked_payment.save(update_fields=[*update_fields, 'updated_at'])

        return locked_payment


def _finalize_expired_reservations(ticket_category: TicketCategory):
    expired_reservations = list(
        PaymentTransaction.objects.filter(
            ticket_category=ticket_category,
            stock_reserved=True,
            tickets_issued=False,
            reservation_expires_at__lte=timezone.now(),
        ).order_by('created_at')
    )

    for payment in expired_reservations:
        if payment.pidx.startswith(PLACEHOLDER_PIDX_PREFIX):
            _release_stock_reservation(payment, status_value='Initiation Failed')
            continue

        khalti_response = _khalti_request('/epayment/lookup/', {'pidx': payment.pidx})
        if not khalti_response['ok']:
            continue

        payment = _sync_payment_from_lookup(payment, khalti_response['data'])
        if _is_completed_status(payment.status):
            issued_tickets, newly_issued = _issue_tickets(payment)
            if newly_issued and issued_tickets:
                try:
                    _send_booking_confirmation_email(payment, issued_tickets)
                except Exception:
                    logger.exception('Failed to send booking confirmation email for payment %s', payment.id)
                try:
                    _send_organizer_booking_notification_email(payment, issued_tickets)
                except Exception:
                    logger.exception('Failed to send organizer booking notification email for payment %s', payment.id)


def _issue_tickets(payment: PaymentTransaction):
    if payment.tickets_issued:
        return list(payment.tickets.order_by('created_at', 'id')), False

    with transaction.atomic():
        locked_payment = PaymentTransaction.objects.select_for_update().get(id=payment.id)
        if locked_payment.tickets_issued:
            return list(locked_payment.tickets.order_by('created_at', 'id')), False

        if not _is_completed_status(locked_payment.status):
            return [], False

        category = TicketCategory.objects.select_for_update().get(id=locked_payment.ticket_category_id)
        snapshot_updates = {}
        if not locked_payment.ticket_category_name_snapshot:
            snapshot_updates['ticket_category_name_snapshot'] = category.name
        if locked_payment.ticket_unit_price_snapshot is None:
            snapshot_updates['ticket_unit_price_snapshot'] = category.price
        if snapshot_updates:
            PaymentTransaction.objects.filter(pk=locked_payment.pk).update(**snapshot_updates)
            for field, value in snapshot_updates.items():
                setattr(locked_payment, field, value)

        if locked_payment.stock_reserved:
            locked_payment.stock_reserved = False
            locked_payment.reservation_expires_at = None
            snapshot_updates['stock_reserved'] = False
            snapshot_updates['reservation_expires_at'] = None
        else:
            if category.quantity < locked_payment.quantity:
                raise ValueError('Ticket stock is no longer available.')
            category.quantity -= locked_payment.quantity
            category.save(update_fields=['quantity'])

        tickets = []
        for _ in range(locked_payment.quantity):
            qr_token = uuid.uuid4().hex
            ticket = Ticket.objects.create(
                attendee=locked_payment.attendee,
                concert=locked_payment.concert,
                ticket_category=locked_payment.ticket_category,
                payment_transaction=locked_payment,
                qr_token=qr_token,
                token_pin=_generate_token_pin(),
            )
            tickets.append(ticket)

        locked_payment.tickets_issued = True
        update_fields = ['tickets_issued', 'updated_at']
        if 'stock_reserved' in snapshot_updates:
            update_fields.extend(['stock_reserved', 'reservation_expires_at'])
        locked_payment.save(update_fields=update_fields)
        return tickets, True


def _send_booking_confirmation_email(payment: PaymentTransaction, tickets):
    attendee = payment.attendee
    if not attendee or not attendee.email:
        return

    prefs, _ = NotificationPreference.objects.get_or_create(user=attendee)
    if not prefs.email_bookings:
        return

    concert = payment.concert
    ticket_category_name = payment.ticket_category_name_display or getattr(payment.ticket_category, 'name', '')
    total_rupees = Decimal(payment.amount_paisa) / Decimal('100')
    concert_dt = (
        localtime(concert.date_time).strftime('%Y-%m-%d %I:%M %p')
        if concert.date_time else ''
    )
    ticket_lines = '\n'.join(
        f'- Ticket {index + 1}: QR {ticket.qr_token}'
        for index, ticket in enumerate(tickets)
    )
    subject = 'SoundStage booking confirmation'
    message = (
        f"Hi {attendee.get_full_name() or attendee.username or 'Attendee'},\n\n"
        'Your booking is confirmed.\n\n'
        f"Concert: {concert.title}\n"
        f"Date & Time: {concert_dt}\n"
        f"Venue: {concert.venue}\n"
        f"Ticket Type: {ticket_category_name}\n"
        f"Quantity: {payment.quantity}\n"
        f"Total Paid: NPR {total_rupees}\n\n"
        'You can also view your tickets in the SoundStage attendee app.\n'
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [attendee.email], fail_silently=False)


def _send_organizer_booking_notification_email(payment: PaymentTransaction, tickets):
    concert = payment.concert
    organizer = getattr(concert, 'organizer', None)
    if not organizer:
        return

    concert_dt = (
        localtime(concert.date_time).strftime('%Y-%m-%d %I:%M %p')
        if concert.date_time else ''
    )

    prefs, _ = NotificationPreference.objects.get_or_create(user=organizer)
    if not prefs.email_bookings:
        return

    recipient_list = []
    for email in [getattr(concert, 'contact_email', ''), getattr(organizer, 'email', '')]:
        normalized = (email or '').strip()
        if normalized and normalized not in recipient_list:
            recipient_list.append(normalized)
    if not recipient_list:
        return

    attendee = payment.attendee
    ticket_category_name = payment.ticket_category_name_display or getattr(payment.ticket_category, 'name', '')
    total_rupees = Decimal(payment.amount_paisa) / Decimal('100')
    ticket_count = len(tickets or [])
    attendee_name = attendee.get_full_name() if attendee else ''
    attendee_label = attendee_name or getattr(attendee, 'username', None) or 'Attendee'
    attendee_email = getattr(attendee, 'email', None) or 'N/A'

    subject = f'New booking for {concert.title}'
    message = (
        f"Hi {organizer.get_full_name() or organizer.username or 'Organizer'},\n\n"
        'A new attendee booking was completed for your concert.\n\n'
        f"Concert: {concert.title}\n"
        f"Date & Time: {concert_dt}\n"
        f"Venue: {concert.venue}\n"
        f"Attendee: {attendee_label}\n"
        f"Attendee Email: {attendee_email}\n"
        f"Ticket Type: {ticket_category_name}\n"
        f"Quantity: {payment.quantity}\n"
        f"Tickets Issued: {ticket_count}\n"
        f"Total Paid: NPR {total_rupees}\n"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAttendee])
def khalti_initiate(request):
    concert_id = request.data.get('concert_id')
    ticket_category_id = request.data.get('ticket_category_id')
    quantity = request.data.get('quantity', 1)

    if not concert_id or not ticket_category_id:
        return Response(
            {'detail': 'concert_id and ticket_category_id are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        quantity = int(quantity)
    except (TypeError, ValueError):
        return Response({'detail': 'quantity must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    if quantity < 1:
        return Response({'detail': 'quantity must be at least 1.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        concert = Concert.objects.get(id=concert_id)
    except Concert.DoesNotExist:
        return Response({'detail': 'Concert not found.'}, status=status.HTTP_404_NOT_FOUND)

    if concert.date_time <= timezone.now():
        return Response(
            {'detail': 'Tickets can no longer be purchased for past concerts.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        ticket_category = TicketCategory.objects.get(id=ticket_category_id, concert=concert)
    except TicketCategory.DoesNotExist:
        return Response(
            {'detail': 'Ticket category not found for this concert.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    _finalize_expired_reservations(ticket_category)

    total_rupees = Decimal(ticket_category.price) * Decimal(quantity)
    total_paisa = int((total_rupees * Decimal('100')).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    if total_paisa < 1000:
        return Response(
            {'detail': 'Minimum payable amount is Rs 10 (1000 paisa).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    purchase_order_id = f'SS-{uuid.uuid4().hex[:16]}'
    purchase_order_name = f'{concert.title} - {ticket_category.name} x{quantity}'
    try:
        payment = _create_reserved_payment(
            attendee=request.user,
            concert=concert,
            ticket_category=ticket_category,
            purchase_order_id=purchase_order_id,
            amount_paisa=total_paisa,
            quantity=quantity,
        )
    except ValueError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)

    payload = {
        'return_url': f'{settings.FRONTEND_URL}/attendee/payment/khalti/callback',
        'website_url': settings.FRONTEND_URL,
        'amount': total_paisa,
        'purchase_order_id': purchase_order_id,
        'purchase_order_name': purchase_order_name,
        'customer_info': {
            'name': request.user.get_full_name() or request.user.username or 'Customer',
            'email': request.user.email or '',
        },
    }

    khalti_response = _khalti_request('/epayment/initiate/', payload)
    if not khalti_response['ok']:
        _release_stock_reservation(
            payment,
            status_value='Initiation Failed',
            raw_response=khalti_response['data'],
        )
        return Response(khalti_response['data'], status=khalti_response['status'])

    pidx = khalti_response['data'].get('pidx')
    if not pidx:
        _release_stock_reservation(
            payment,
            status_value='Initiation Failed',
            raw_response=khalti_response['data'],
        )
        return Response(
            {'detail': 'Khalti did not return a valid payment reference.'},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    payment.pidx = pidx
    payment.status = khalti_response['data'].get('status') or payment.status
    payment.transaction_id = khalti_response['data'].get('transaction_id') or payment.transaction_id
    payment.raw_response = khalti_response['data']
    payment.save(update_fields=['pidx', 'status', 'transaction_id', 'raw_response', 'updated_at'])

    return Response(
        {
            'success': True,
            'data': {
                **khalti_response['data'],
                'amount': total_paisa,
                'concert_id': str(concert.id),
                'ticket_category_id': str(ticket_category.id),
                'quantity': quantity,
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAttendee])
def khalti_lookup(request):
    pidx = request.data.get('pidx')
    if not pidx:
        return Response({'detail': 'pidx is required.'}, status=status.HTTP_400_BAD_REQUEST)

    khalti_response = _khalti_request('/epayment/lookup/', {'pidx': pidx})
    if not khalti_response['ok']:
        return Response(khalti_response['data'], status=khalti_response['status'])

    payment = PaymentTransaction.objects.filter(pidx=pidx, attendee=request.user).first()
    if payment:
        _sync_payment_from_lookup(payment, khalti_response['data'])

    return Response({'success': True, 'data': khalti_response['data']}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAttendee])
def khalti_confirm(request):
    pidx = request.data.get('pidx')
    if not pidx:
        return Response({'detail': 'pidx is required.'}, status=status.HTTP_400_BAD_REQUEST)

    payment = PaymentTransaction.objects.filter(pidx=pidx, attendee=request.user).first()
    if not payment:
        return Response({'detail': 'Payment transaction not found.'}, status=status.HTTP_404_NOT_FOUND)

    khalti_response = _khalti_request('/epayment/lookup/', {'pidx': pidx})
    if not khalti_response['ok']:
        return Response(khalti_response['data'], status=khalti_response['status'])

    lookup_data = khalti_response['data']
    payment = _sync_payment_from_lookup(payment, lookup_data)

    if not _is_completed_status(lookup_data.get('status')):
        return Response(
            {'success': True, 'data': {'status': lookup_data.get('status'), 'tickets': []}},
            status=status.HTTP_200_OK,
        )

    try:
        issued_tickets, newly_issued = _issue_tickets(payment)
    except ValueError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)

    if newly_issued and issued_tickets:
        try:
            _send_booking_confirmation_email(payment, issued_tickets)
        except Exception:
            logger.exception('Failed to send booking confirmation email for payment %s', payment.id)
        try:
            _send_organizer_booking_notification_email(payment, issued_tickets)
        except Exception:
            logger.exception('Failed to send organizer booking notification email for payment %s', payment.id)

    serializer = TicketSerializer(issued_tickets, many=True)
    return Response(
        {
            'success': True,
            'data': {
                'status': lookup_data.get('status'),
                'tickets': serializer.data,
            },
        },
        status=status.HTTP_200_OK,
    )
