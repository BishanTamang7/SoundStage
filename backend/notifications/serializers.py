from rest_framework import serializers

from .models import NotificationPreference


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_bookings', 'event_reminders', 'updated_at']
        read_only_fields = ['updated_at']
