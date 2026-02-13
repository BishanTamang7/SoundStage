from django.db import models
from django.conf import settings
import uuid


class Concert(models.Model):
    """Concert model - MVP version with essential fields only"""
    
    # Primary Key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Foreign Key
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='concerts'
    )
    
    # Basic Info (MVP)
    title = models.CharField(max_length=255)
    description = models.TextField()
    date_time = models.DateTimeField()
    venue = models.CharField(max_length=255)
    
    # Artist Info (MVP)
    main_artist = models.CharField(max_length=255)
    
    # Organizer Contact (MVP)
    organizer_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True, null=True)

    # Media (MVP)
    cover_image = models.ImageField(upload_to="concerts/covers/", blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'concerts'
        verbose_name = 'Concert'
        verbose_name_plural = 'Concerts'
        ordering = ['-date_time']
    
    def __str__(self):
        return f"{self.title} - {self.date_time.date()}"


class TicketCategory(models.Model):
    """Ticket categories - MVP version"""
    
    # Primary Key
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Foreign Key
    concert = models.ForeignKey(
        Concert,
        on_delete=models.CASCADE,
        related_name='ticket_categories'
    )
    
    # Category Details (MVP)
    name = models.CharField(max_length=100)  # VIP, Regular
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ticket_categories'
        verbose_name = 'Ticket Category'
        verbose_name_plural = 'Ticket Categories'
        unique_together = ['concert', 'name']
    
    def __str__(self):
        return f"{self.concert.title} - {self.name} (Rs {self.price})"


class PaymentTransaction(models.Model):
    """Stores Khalti transaction lifecycle and ticket issuance state."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='payment_transactions'
    )
    concert = models.ForeignKey(
        Concert,
        on_delete=models.CASCADE,
        related_name='payment_transactions'
    )
    ticket_category = models.ForeignKey(
        TicketCategory,
        on_delete=models.CASCADE,
        related_name='payment_transactions'
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
        return f"{self.purchase_order_id} ({self.status})"


class Ticket(models.Model):
    """Issued ticket with unique QR token."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    attendee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    concert = models.ForeignKey(
        Concert,
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    ticket_category = models.ForeignKey(
        TicketCategory,
        on_delete=models.CASCADE,
        related_name='tickets'
    )
    payment_transaction = models.ForeignKey(
        PaymentTransaction,
        on_delete=models.CASCADE,
        related_name='tickets'
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
        related_name='validated_tickets'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tickets'
        ordering = ['-created_at']
        unique_together = ['payment_transaction', 'seat_number']

    def __str__(self):
        return f"Ticket {self.qr_token} - {self.concert.title}"
