from django.urls import path

from .views import (
    esewa_confirm,
    esewa_initiate,
    esewa_lookup,
    khalti_confirm,
    khalti_initiate,
    khalti_lookup,
)

app_name = 'payments'

urlpatterns = [
    path('khalti/initiate/', khalti_initiate, name='khalti-initiate'),
    path('khalti/lookup/', khalti_lookup, name='khalti-lookup'),
    path('khalti/confirm/', khalti_confirm, name='khalti-confirm'),
    path('esewa/initiate/', esewa_initiate, name='esewa-initiate'),
    path('esewa/lookup/', esewa_lookup, name='esewa-lookup'),
    path('esewa/confirm/', esewa_confirm, name='esewa-confirm'),
]
