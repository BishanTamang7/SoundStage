from django.urls import path

from .views import NotificationHealthAPIView

app_name = 'notifications'

urlpatterns = [
    path('health/', NotificationHealthAPIView.as_view(), name='health'),
]
