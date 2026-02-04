from rest_framework import status, viewsets
from rest_framework.decorators import action
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