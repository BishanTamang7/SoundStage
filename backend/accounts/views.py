from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from .serializers import UserRegistrationSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserRegistrationSerializer, UserLoginSerializer



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