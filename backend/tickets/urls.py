from django.urls import path

from .views import delete_my_ticket, my_tickets, organizer_bookings, verify_ticket

app_name = 'tickets'

urlpatterns = [
    path('my/', my_tickets, name='my-tickets'),
    path('organizer/bookings/', organizer_bookings, name='organizer-bookings'),
    path('<uuid:ticket_id>/', delete_my_ticket, name='delete-my-ticket'),
    path('verify/', verify_ticket, name='verify-ticket'),
]
