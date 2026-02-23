from django.urls import path

from .views import NotificationHealthAPIView, NotificationPreferenceAPIView

app_name = 'notifications'

urlpatterns = [
    path('health/', NotificationHealthAPIView.as_view(), name='health'),
    path('preferences/', NotificationPreferenceAPIView.as_view(), name='preferences'),
]
