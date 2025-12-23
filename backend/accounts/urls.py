from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView 
from .views import UserRegistrationAPIView, UserLoginAPIView, UserProfileAPIView

app_name = 'accounts'

urlpatterns = [
    path('register/', UserRegistrationAPIView.as_view(), name='register'),
    path('login/', UserLoginAPIView.as_view(), name='login'),
    path('profile/', UserProfileAPIView.as_view(), name='profile'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]