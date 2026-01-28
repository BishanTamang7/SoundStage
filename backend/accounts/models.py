from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager for creating users"""
    
    def create_user(self, email, username, password=None, role='ATTENDEE', **extra_fields):
        """Create and save a regular user"""
        if not email:
            raise ValueError('Email is required')
        if not username:
            raise ValueError('Username is required')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, role=role, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """Create and save a superuser"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', self.model.ORGANIZER)
        
        return self.create_user(email, username, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email as unique identifier"""
    
    # Role choices
    ORGANIZER = 'ORGANIZER'
    ATTENDEE = 'ATTENDEE'
    ROLE_CHOICES = [
        (ORGANIZER, 'Organizer'),
        (ATTENDEE, 'Attendee'),
    ]
    
    # User fields
    email = models.EmailField(max_length=255, unique=True, db_index=True)
    username = models.CharField(max_length=150, unique=True, db_index=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ATTENDEE)
    
    # Additional useful fields
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    
    # Status fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # Needed for admin access
    
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
        """Return the first_name plus the last_name, with a space in between"""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def get_short_name(self):
        """Return the short name for the user"""
        return self.first_name or self.username
    
    @property
    def is_organizer(self):
        """Check if user is an organizer"""
        return self.role == self.ORGANIZER
    
    @property
    def is_attendee(self):
        """Check if user is an attendee"""
        return self.role == self.ATTENDEE