import json
import uuid
from decimal import Decimal, ROUND_HALF_UP
from urllib import error as url_error
from urllib import request as url_request

from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Concert, TicketCategory
from .serializers import (
    ConcertCreateSerializer,
    ConcertListSerializer,
    ConcertDetailSerializer
)
# Import permissions from accounts app (already exists there)
from accounts.permissions import IsOrganizer


class ConcertViewSet(viewsets.ModelViewSet):
    """ViewSet for Concert CRUD operations - MVP"""
    
    queryset = Concert.objects.all()
    
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
        serializer.save()
        
        return Response({
            'success': True,
            'message': 'Concert updated successfully',
            'data': {
                'concert_id': str(instance.id),
                'updated_at': instance.updated_at
            }
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
        queryset = Concert.objects.filter(organizer=request.user)
        serializer = ConcertListSerializer(queryset, many=True)
        
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

    return Response({'success': True, 'data': khalti_response['data']}, status=status.HTTP_200_OK)
