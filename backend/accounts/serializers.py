from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with validation"""
    
    password = serializers.CharField(write_only=True, required=True)
    confirm_password = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['id', 'role', 'username', 'email', 'password', 'confirm_password', 'date_joined']
        read_only_fields = ['id', 'date_joined']
    
    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value.strip()
    
    def validate_email(self, value):
        """Check if email already exists"""
        email = value.lower().strip()
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Email already exists.")
        return email
    
    def validate_role(self, value):
        """Validate role is valid choice"""
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Choose: {', '.join(valid_roles)}")
        return value
    
    def validate_password(self, value):
        """Validate password using Django validators"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value
    
    def validate(self, attrs):
        """Check if passwords match"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        attrs.pop('confirm_password')
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        password = validated_data.pop('password')
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=password,
            role=validated_data.get('role', User.ATTENDEE)
        )
        return user