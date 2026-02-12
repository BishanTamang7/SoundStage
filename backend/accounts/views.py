from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    ChangePasswordSerializer,
)


class UserRegistrationAPIView(APIView):
    """API endpoint for user registration"""
    
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def post(self, request):
        """Handle user registration"""
        serializer = self.serializer_class(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens for auto-login after registration
            refresh = RefreshToken.for_user(user)
            
            return Response(
                {
                    'success': True,
                    'message': 'User registered successfully',
                    'data': {
                        'user': serializer.data,
                        'tokens': {
                            'access': str(refresh.access_token),
                            'refresh': str(refresh),
                        }
                    }
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


class UserLogoutAPIView(APIView):
    """API endpoint for user logout (token blacklisting)"""
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Blacklist the refresh token"""
        try:
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {
                        'success': False,
                        'message': 'Refresh token is required'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {
                    'success': True,
                    'message': 'Logout successful'
                },
                status=status.HTTP_200_OK
            )
        
        except TokenError:
            return Response(
                {
                    'success': False,
                    'message': 'Invalid or expired token'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            return Response(
                {
                    'success': False,
                    'message': 'Logout failed'
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class UserProfileAPIView(APIView):
    """API endpoint to get authenticated user profile"""
    
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    
    def get(self, request):
        """Get current user profile"""
        serializer = self.serializer_class(request.user)
        
        return Response(
            {
                'success': True,
                'data': serializer.data
            },
            status=status.HTTP_200_OK
        )

    def patch(self, request):
        """Update current user profile"""
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = self.serializer_class(request.user)
            return Response(
                {
                    'success': True,
                    'message': 'Profile updated successfully',
                    'data': response_serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request):
        """Delete current authenticated user account"""
        try:
            request.user.delete()
            return Response(
                {
                    'success': True,
                    'message': 'Account deleted successfully',
                },
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {
                    'success': False,
                    'message': 'Failed to delete account',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


class ChangePasswordAPIView(APIView):
    """API endpoint to update authenticated user password"""

    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save(update_fields=['password'])
            return Response(
                {
                    'success': True,
                    'message': 'Password updated successfully',
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
