from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from .serializers import UserRegistrationSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserLoginSerializer
from .permissions import IsOrganizer, IsAttendee


class UserRegistrationAPIView(APIView):
    """API endpoint for user registration"""
    
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def post(self, request):
        """Handle user registration"""
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            # Create user within transaction
            with transaction.atomic():
                user = serializer.save()
            
            return Response(
                {
                    'success': True,
                    'message': 'User registered successfully',
                    'data': serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        
        return Response(
            {
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class UserLoginAPIView(APIView):
    """API endpoint for user login"""
    
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer
    
    def post(self, request):
        """Handle user login and return JWT tokens"""
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'data': {
                        'user': {
                            'id': user.id,
                            'email': user.email,
                            'username': user.username,
                            'role': user.role,
                        },
                        'tokens': {
                            'access': serializer.validated_data['access'],
                            'refresh': serializer.validated_data['refresh'],
                        }
                    }
                },
                status=status.HTTP_200_OK
            )
        
        return Response(
            {
                'success': False,
                'message': 'Authentication failed',
                'errors': serializer.errors
            },
            status=status.HTTP_401_UNAUTHORIZED
        )


class UserProfileAPIView(APIView):
    """API endpoint to get authenticated user profile"""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user profile"""
        user = request.user
        
        return Response(
            {
                'success': True,
                'data': {
                    'id': user.id,
                    'email': user.email,
                    'username': user.username,
                    'role': user.role,
                    'date_joined': user.date_joined,
                }
            },
            status=status.HTTP_200_OK
        )


class OrganizerOnlyAPIView(APIView):
    """
    Example: API endpoint accessible only by Organizers
    Use this pattern for creating events, managing venues, etc.
    """
    
    permission_classes = [IsAuthenticated, IsOrganizer]
    
    def get(self, request):
        """Only Organizers can access this"""
        return Response(
            {
                'success': True,
                'message': 'Welcome Organizer!',
                'data': {
                    'user': request.user.username,
                    'role': request.user.role,
                    'access': 'You can create and manage events'
                }
            },
            status=status.HTTP_200_OK
        )
    
    def post(self, request):
        """Example: Create event (Organizer only)"""
        return Response(
            {
                'success': True,
                'message': 'Event created successfully',
                'data': {
                    'created_by': request.user.username,
                    'role': request.user.role
                }
            },
            status=status.HTTP_201_CREATED
        )


class AttendeeOnlyAPIView(APIView):
    """
    Example: API endpoint accessible only by Attendees
    Use this pattern for booking tickets, registering for events, etc.
    """
    
    permission_classes = [IsAuthenticated, IsAttendee]
    
    def get(self, request):
        """Only Attendees can access this"""
        return Response(
            {
                'success': True,
                'message': 'Welcome Attendee!',
                'data': {
                    'user': request.user.username,
                    'role': request.user.role,
                    'access': 'You can browse and register for events'
                }
            },
            status=status.HTTP_200_OK
        )
    
    def post(self, request):
        """Example: Register for event (Attendee only)"""
        return Response(
            {
                'success': True,
                'message': 'Registered for event successfully',
                'data': {
                    'registered_by': request.user.username,
                    'role': request.user.role
                }
            },
            status=status.HTTP_201_CREATED
        )


class AllUsersAPIView(APIView):
    """
    Example: API endpoint accessible by all authenticated users
    Both Organizers and Attendees can access
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """All authenticated users can access"""
        return Response(
            {
                'success': True,
                'message': f'Welcome {request.user.role}!',
                'data': {
                    'user': request.user.username,
                    'role': request.user.role,
                    'access': 'All authenticated users can view this'
                }
            },
            status=status.HTTP_200_OK
        )