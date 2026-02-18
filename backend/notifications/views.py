from rest_framework.response import Response
from rest_framework.views import APIView


class NotificationHealthAPIView(APIView):
    def get(self, request):
        return Response({'success': True, 'message': 'Notifications app is ready.'})
