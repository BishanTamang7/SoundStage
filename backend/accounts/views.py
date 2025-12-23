from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.db import transaction
from .serializers import UserRegistrationSerializer


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