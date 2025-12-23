from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView 
from .views import UserRegistrationAPIView, UserLoginAPIView, UserProfileAPIView, OrganizerOnlyAPIView, AttendeeOnlyAPIView, AllUsersAPIView

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('register/', UserRegistrationAPIView.as_view(), name='register'),
    path('login/', UserLoginAPIView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

     # User profile
     path('profile/', UserProfileAPIView.as_view(), name='profile'),
     
     # Role-based endpoints
    path('organizer-only/', OrganizerOnlyAPIView.as_view(), name='organizer_only'),
    path('attendee-only/', AttendeeOnlyAPIView.as_view(), name='attendee_only'),
    path('all-users/', AllUsersAPIView.as_view(), name='all_users'),
]