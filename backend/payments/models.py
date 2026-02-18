import uuid

from django.conf import settings
from django.db import models


class PaymentTransaction(models.Model):
    """Stores Khalti transaction lifecycle and ticket issuance state."""

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
    pidx = models.CharField(max_length=255, unique=True)
    purchase_order_id = models.CharField(max_length=255, unique=True)
    amount_paisa = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=50, default='Initiated')
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
