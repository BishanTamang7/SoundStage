import json
import uuid
from decimal import Decimal, ROUND_HALF_UP
from urllib import error as url_error
from urllib import request as url_request

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Concert, TicketCategory, PaymentTransaction, Ticket
from .serializers import (
    ConcertCreateSerializer,
    ConcertListSerializer,
    ConcertDetailSerializer,
    TicketSerializer,
    OrganizerBookingSerializer,
)
# Import permissions from accounts app (already exists there)
from accounts.permissions import IsOrganizer, IsAttendee


class ConcertViewSet(viewsets.ModelViewSet):
    """ViewSet for Concert CRUD operations - MVP"""
    
    queryset = Concert.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in ['retrieve', 'my_events']:
            return ConcertDetailSerializer.setup_eager_loading(queryset)
        return queryset
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return ConcertCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return ConcertDetailSerializer
        return ConcertListSerializer
    
    def get_permissions(self):
        """Set permissions based on action"""
        if self.action == 'list':
            return [AllowAny()]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOrganizer()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """Create a new concert"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set organizer to current user
        concert = serializer.save(organizer=request.user)
        
        return Response(
            {
                'success': True,
                'message': 'Concert created successfully',
                'data': {
                    'concert_id': str(concert.id),
                    'title': concert.title,
                    'created_at': concert.created_at
                }
            },
            status=status.HTTP_201_CREATED
        )
    
    def list(self, request, *args, **kwargs):
        """List all concerts"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': {
                'concerts': serializer.data
            }
        })
    
    def retrieve(self, request, *args, **kwargs):
        """Get concert details"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        """Update concert"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if user is the organizer
        if instance.organizer != request.user:
            return Response(
                {
                    'success': False,
                    'message': 'You do not have permission to edit this concert'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        concert = serializer.save()
        response_serializer = ConcertDetailSerializer(concert)
        
        return Response({
            'success': True,
            'message': 'Concert updated successfully',
            'data': response_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete concert"""
        instance = self.get_object()
        
        # Check if user is the organizer
        if instance.organizer != request.user:
            return Response(
                {
                    'success': False,
                    'message': 'You do not have permission to delete this concert'
                },
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance.delete()
        
        return Response(
            {
                'success': True,
                'message': 'Concert deleted successfully'
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsOrganizer])
    def my_events(self, request):
        """Get concerts created by the organizer"""
        queryset = self.get_queryset().filter(organizer=request.user)
        serializer = ConcertDetailSerializer(queryset, many=True)
        
        return Response({
            'success': True,
            'data': {
                'concerts': serializer.data
            }
        })


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
    payment.status = lookup_data.get('status') or payment.status
    payment.transaction_id = lookup_data.get('transaction_id') or payment.transaction_id
    payment.raw_response = lookup_data
    payment.save(update_fields=['status', 'transaction_id', 'raw_response', 'updated_at'])


def _issue_tickets(payment: PaymentTransaction):
    if payment.tickets_issued:
        return list(payment.tickets.order_by('seat_number'))

    with transaction.atomic():
        locked_payment = PaymentTransaction.objects.select_for_update().get(id=payment.id)
        if locked_payment.tickets_issued:
            return list(locked_payment.tickets.order_by('seat_number'))

        if locked_payment.status != 'Completed':
            return []

        category = TicketCategory.objects.select_for_update().get(id=locked_payment.ticket_category_id)
        if category.quantity < locked_payment.quantity:
            raise ValueError('Ticket stock is no longer available.')

        category.quantity -= locked_payment.quantity
        category.save(update_fields=['quantity'])

        tickets = []
        for seat_number in range(1, locked_payment.quantity + 1):
            ticket = Ticket.objects.create(
                attendee=locked_payment.attendee,
                concert=locked_payment.concert,
                ticket_category=locked_payment.ticket_category,
                payment_transaction=locked_payment,
                seat_number=seat_number,
                qr_token=uuid.uuid4().hex,
            )
            tickets.append(ticket)

        locked_payment.tickets_issued = True
        locked_payment.save(update_fields=['tickets_issued', 'updated_at'])
        return tickets


@api_view(['POST'])
@permission_classes([IsAuthenticated])
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

    try:
        ticket_category = TicketCategory.objects.get(id=ticket_category_id, concert=concert)
    except TicketCategory.DoesNotExist:
        return Response(
            {'detail': 'Ticket category not found for this concert.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    if ticket_category.quantity < quantity:
        return Response(
            {'detail': 'Requested quantity exceeds available tickets.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    total_rupees = Decimal(ticket_category.price) * Decimal(quantity)
    total_paisa = int((total_rupees * Decimal('100')).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
    if total_paisa < 1000:
        return Response(
            {'detail': 'Minimum payable amount is Rs 10 (1000 paisa).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    purchase_order_id = f'SS-{uuid.uuid4().hex[:16]}'
    purchase_order_name = f'{concert.title} - {ticket_category.name} x{quantity}'

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
        return Response(khalti_response['data'], status=khalti_response['status'])

    pidx = khalti_response['data'].get('pidx')
    if pidx:
        PaymentTransaction.objects.update_or_create(
            pidx=pidx,
            defaults={
                'attendee': request.user,
                'concert': concert,
                'ticket_category': ticket_category,
                'purchase_order_id': purchase_order_id,
                'amount_paisa': total_paisa,
                'quantity': quantity,
                'status': 'Initiated',
                'raw_response': khalti_response['data'],
            },
        )

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
@permission_classes([IsAuthenticated])
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
    _sync_payment_from_lookup(payment, lookup_data)

    if lookup_data.get('status') != 'Completed':
        return Response(
            {
                'success': True,
                'data': {
                    'status': lookup_data.get('status'),
                    'tickets': [],
                },
            },
            status=status.HTTP_200_OK,
        )

    try:
        issued_tickets = _issue_tickets(payment)
    except ValueError as exc:
        return Response({'detail': str(exc)}, status=status.HTTP_409_CONFLICT)

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


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAttendee])
def my_tickets(request):
    queryset = (
        Ticket.objects.select_related('concert', 'ticket_category', 'attendee', 'payment_transaction')
        .filter(attendee=request.user)
        .order_by('-created_at')
    )
    serializer = TicketSerializer(queryset, many=True)
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

    attendee_name = (
        ticket.attendee.get_full_name()
        or ticket.attendee.username
        or ticket.attendee.email
    )
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
