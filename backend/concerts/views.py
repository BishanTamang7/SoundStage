from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import Concert
from .serializers import (
    ConcertCreateSerializer,
)
# Import permissions from accounts app
from accounts.permissions import IsOrganizer


class ConcertViewSet(viewsets.ModelViewSet):
    """ViewSet for Concert CRUD operations"""
    
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