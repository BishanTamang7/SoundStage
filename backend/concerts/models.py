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