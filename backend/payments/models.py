import uuid
from decimal import Decimal

from django.conf import settings
from django.db import models


class PaymentTransaction(models.Model):
    """Stores payment transaction lifecycle and ticket issuance state."""

    PROVIDER_KHALTI = 'KHALTI'
    PROVIDER_ESEWA = 'ESEWA'
    PROVIDER_CHOICES = [
        (PROVIDER_KHALTI, 'Khalti'),
        (PROVIDER_ESEWA, 'eSewa'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_transactions',
    )
    concert = models.ForeignKey(
        'events.Concert',
        on_delete=models.CASCADE,
        related_name='payment_transactions',
    )
    ticket_category = models.ForeignKey(
        'tickets.TicketCategory',
        on_delete=models.CASCADE,
        related_name='payment_transactions',
    )
    provider = models.CharField(
        max_length=20,
        choices=PROVIDER_CHOICES,
        default=PROVIDER_KHALTI,
    )
    pidx = models.CharField(max_length=255, unique=True)
    purchase_order_id = models.CharField(max_length=255, unique=True)
    amount_paisa = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=50, default='Initiated')
    stock_reserved = models.BooleanField(default=False)
    reservation_expires_at = models.DateTimeField(blank=True, null=True)
    ticket_category_name_snapshot = models.CharField(max_length=100, blank=True)
    ticket_unit_price_snapshot = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    transaction_id = models.CharField(max_length=255, blank=True, null=True)
    raw_response = models.JSONField(default=dict, blank=True)
    tickets_issued = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payment_transactions'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.purchase_order_id} ({self.status})'

    @property
    def ticket_category_name_display(self):
        if self.ticket_category_name_snapshot:
            return self.ticket_category_name_snapshot
        if self.ticket_category_id and getattr(self, 'ticket_category', None):
            return self.ticket_category.name
        return ''

    @property
    def ticket_unit_price_display(self):
        if self.ticket_unit_price_snapshot is not None:
            return self.ticket_unit_price_snapshot
        if self.ticket_category_id and getattr(self, 'ticket_category', None):
            return self.ticket_category.price
        return Decimal('0')
