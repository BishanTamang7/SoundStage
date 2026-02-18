import uuid

from django.conf import settings
from django.db import models


class TicketCategory(models.Model):
    """Ticket categories - MVP version"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    concert = models.ForeignKey(
        'events.Concert',
        on_delete=models.CASCADE,
        related_name='ticket_categories',
    )

    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ticket_categories'
        verbose_name = 'Ticket Category'
        verbose_name_plural = 'Ticket Categories'
        unique_together = ['concert', 'name']

    def __str__(self):
        return f'{self.concert.title} - {self.name} (Rs {self.price})'


class Ticket(models.Model):
    """Issued ticket with unique QR token."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    concert = models.ForeignKey(
        'events.Concert',
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    ticket_category = models.ForeignKey(
        'tickets.TicketCategory',
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    payment_transaction = models.ForeignKey(
        'payments.PaymentTransaction',
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    seat_number = models.PositiveIntegerField()
    qr_token = models.CharField(max_length=64, unique=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(blank=True, null=True)
    used_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='validated_tickets',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['-created_at']
        unique_together = ['payment_transaction', 'seat_number']

    def __str__(self):
        return f'Ticket {self.qr_token} - {self.concert.title}'
