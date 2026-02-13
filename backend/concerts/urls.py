from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'concerts'

# Router for ViewSets
router = DefaultRouter()
router.register(r'concerts', views.ConcertViewSet, basename='concert')

urlpatterns = [
    # Concert endpoints (handled by ViewSet)
    path('', include(router.urls)),
    # Khalti payment endpoints
    path('payments/khalti/initiate/', views.khalti_initiate, name='khalti-initiate'),
    path('payments/khalti/lookup/', views.khalti_lookup, name='khalti-lookup'),
    path('payments/khalti/confirm/', views.khalti_confirm, name='khalti-confirm'),
    # Tickets
    path('tickets/my/', views.my_tickets, name='my-tickets'),
    path('tickets/<uuid:ticket_id>/', views.delete_my_ticket, name='delete-my-ticket'),
    path('tickets/verify/', views.verify_ticket, name='verify-ticket'),
]
