from decimal import Decimal

from rest_framework import serializers

from payments.models import PaymentTransaction
from tickets.models import Ticket


class TicketSerializer(serializers.ModelSerializer):
    attendee_name = serializers.SerializerMethodField()
    attendee_email = serializers.EmailField(source='attendee.email', read_only=True)
    concert_title = serializers.CharField(source='concert.title', read_only=True)
    concert_date_time = serializers.DateTimeField(source='concert.date_time', read_only=True)
    concert_venue = serializers.CharField(source='concert.venue', read_only=True)
    ticket_type = serializers.CharField(source='ticket_category.name', read_only=True)
    ticket_price = serializers.DecimalField(source='ticket_category.price', max_digits=10, decimal_places=2, read_only=True)
    booking_id = serializers.UUIDField(source='payment_transaction.id', read_only=True)
    booking_quantity = serializers.IntegerField(source='payment_transaction.quantity', read_only=True)
    booking_total_paisa = serializers.IntegerField(source='payment_transaction.amount_paisa', read_only=True)
    booking_total_rupees = serializers.SerializerMethodField()
    booked_at = serializers.DateTimeField(source='created_at', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id',
            'attendee_name',
            'attendee_email',
            'concert_title',
            'concert_date_time',
            'concert_venue',
            'ticket_type',
            'ticket_price',
            'seat_number',
            'qr_token',
            'booking_id',
            'booking_quantity',
            'booking_total_paisa',
            'booking_total_rupees',
            'booked_at',
            'is_used',
            'used_at',
            'created_at',
        ]

    def get_attendee_name(self, obj):
        if obj.attendee:
            return obj.attendee.get_full_name() or obj.attendee.username or obj.attendee.email
        return 'Attendee'

    def get_booking_total_rupees(self, obj):
        if not obj.payment_transaction:
            return Decimal('0')
        return Decimal(obj.payment_transaction.amount_paisa) / Decimal('100')


class OrganizerBookingSerializer(serializers.ModelSerializer):
    attendee_name = serializers.SerializerMethodField()
    attendee_email = serializers.EmailField(source='attendee.email', read_only=True)
    concert_title = serializers.CharField(source='concert.title', read_only=True)
    ticket_type = serializers.CharField(source='ticket_category.name', read_only=True)
    amount_rupees = serializers.SerializerMethodField()

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'attendee_name',
            'attendee_email',
            'concert_title',
            'ticket_type',
            'quantity',
            'amount_rupees',
            'created_at',
        ]

    def get_attendee_name(self, obj):
        if obj.attendee:
            return obj.attendee.get_full_name() or obj.attendee.username or obj.attendee.email
        return 'Customer'

    def get_amount_rupees(self, obj):
        return Decimal(obj.amount_paisa) / Decimal('100')
