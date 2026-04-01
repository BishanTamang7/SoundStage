from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager for creating users"""

    def create_user(self, email, username, password=None, role='ATTENDEE', **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('Email is required')
        if not username:
            raise ValueError('Username is required')

        email = self.normalize_email(email)
        extra_fields.setdefault('email_verified', False)
        extra_fields.setdefault('status', User.STATUS_PENDING_VERIFICATION)
        user = self.model(email=email, username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        """Create and save an organizer account"""
        extra_fields.setdefault('role', self.model.ORGANIZER)
        extra_fields.setdefault('email_verified', True)
        extra_fields.setdefault('status', User.STATUS_ACTIVE)
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser):
    """Custom user model with email as unique identifier"""

    # Role choices
    ORGANIZER = 'ORGANIZER'
    ATTENDEE = 'ATTENDEE'
    ROLE_CHOICES = [
        (ORGANIZER, 'Organizer'),
        (ATTENDEE, 'Attendee'),
    ]

    # Account status choices
    STATUS_PENDING_VERIFICATION = 'PENDING_VERIFICATION'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_SUSPENDED = 'SUSPENDED'
    STATUS_CHOICES = [
        (STATUS_PENDING_VERIFICATION, 'Pending Verification'),
        (STATUS_ACTIVE, 'Active'),
    ]

    # User fields
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ATTENDEE)
    profile_photo = models.ImageField(upload_to='accounts/profile_photos/', blank=True, null=True)

    # Status fields
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING_VERIFICATION,
        db_index=True,
    )
    # Timestamps
    date_joined = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    def get_full_name(self):
        """Return the display name for the user"""
        return self.username

    def get_short_name(self):
        """Return the short name for the user"""
        return self.username

    @property
    def is_organizer(self):
        """Check if user is an organizer"""
        return self.role == self.ORGANIZER

    @property
    def is_attendee(self):
        """Check if user is an attendee"""
        return self.role == self.ATTENDEE


class EmailVerificationToken(models.Model):
    """Single-use email verification tokens."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification_tokens',
    )
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]

    @property
    def is_expired(self):
        return timezone.now() >= self.expires_at


class EmailVerificationOTP(models.Model):
    """Single-use email verification OTP records."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification_otps',
    )
    otp_hash = models.CharField(max_length=64, db_index=True)
    otp_salt = models.CharField(max_length=32)
    expires_at = models.DateTimeField(db_index=True)
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    resend_count = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
        ]
