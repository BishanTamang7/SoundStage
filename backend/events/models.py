import uuid

from django.conf import settings
from django.db import models

from events.constants import CONCERT_GENRE_CHOICES


class Concert(models.Model):
    """Concert model - MVP version with essential fields only"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organizer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='concerts',
    )

    title = models.CharField(max_length=255)
    description = models.TextField()
    genre = models.CharField(max_length=32, choices=CONCERT_GENRE_CHOICES, blank=True, null=True)
    date_time = models.DateTimeField()
    venue = models.CharField(max_length=255)
    main_artist = models.CharField(max_length=255)

    organizer_name = models.CharField(max_length=255)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20, blank=True, null=True)

    cover_image = models.ImageField(upload_to='concerts/covers/', blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'concerts'
        verbose_name = 'Concert'
        verbose_name_plural = 'Concerts'
        ordering = ['-date_time']

    def __str__(self):
        return f'{self.title} - {self.date_time.date()}'
