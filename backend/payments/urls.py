from django.urls import path

from .views import khalti_confirm, khalti_initiate, khalti_lookup

app_name = 'payments'

urlpatterns = [
    path('khalti/initiate/', khalti_initiate, name='khalti-initiate'),
    path('khalti/lookup/', khalti_lookup, name='khalti-lookup'),
    path('khalti/confirm/', khalti_confirm, name='khalti-confirm'),
]
