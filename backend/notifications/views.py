from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import NotificationPreference
from .serializers import NotificationPreferenceSerializer


class NotificationHealthAPIView(APIView):
    def get(self, request):
        return Response({'success': True, 'message': 'Notifications app is ready.'})


class NotificationPreferenceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, user):
        prefs, _ = NotificationPreference.objects.get_or_create(user=user)
        return prefs

    def get(self, request):
        prefs = self.get_object(request.user)
        serializer = NotificationPreferenceSerializer(prefs)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)

    def patch(self, request):
        prefs = self.get_object(request.user)
        serializer = NotificationPreferenceSerializer(prefs, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'Validation error', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save()
        return Response(
            {'success': True, 'message': 'Notification settings updated.', 'data': serializer.data},
            status=status.HTTP_200_OK,
        )
