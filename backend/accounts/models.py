from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
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


class User(AbstractBaseUser):
    """Custom user model with email as unique identifier"""
    
    # Role choices
    ORGANIZER = 'ORGANIZER'
    ATTENDEE = 'ATTENDEE'
    ROLE_CHOICES = [
        (ORGANIZER, 'Organizer'),
        (ATTENDEE, 'Attendee'),
    ]
    
    # User fields
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ATTENDEE)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email