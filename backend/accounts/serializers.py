from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import User
from django.contrib.auth import authenticate
from django.contrib.auth.models import update_last_login
from rest_framework_simplejwt.tokens import RefreshToken


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration with validation"""
    
    password = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True, 
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'role',
            'username',
            'email',
            'password',
            'confirm_password',
            'id',
            'date_joined'
        ]
        read_only_fields = ['id', 'date_joined']
    
    def validate_username(self, value):
        """Check if username already exists"""
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already exists.")
        
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        
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
            raise serializers.ValidationError(
                f"Invalid role. Choose from: {', '.join(valid_roles)}"
            )
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
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
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


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True, 
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate user credentials"""
        email = attrs.get('email', '').lower().strip()
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError('Email and password are required.')
        
        # Authenticate user
        user = authenticate(username=email, password=password)
        
        if not user:
            existing_user = User.objects.filter(email__iexact=email).first()
            if existing_user and existing_user.check_password(password):
                user = existing_user
            else:
                raise serializers.ValidationError('Invalid email or password.')
        
        if user.status == User.STATUS_PENDING_VERIFICATION:
            raise serializers.ValidationError('Please verify your email before logging in.')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')
        if not user.email_verified:
            raise serializers.ValidationError('Please verify your email before logging in.')
        if user.status != User.STATUS_ACTIVE:
            raise serializers.ValidationError('Your account is not active.')

        update_last_login(None, user)
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return {
            'user': user,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user profile (read operations)"""
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role',
            'is_active', 'email_verified', 'status', 'date_joined', 'updated_at', 'profile_photo'
        ]
        read_only_fields = [
            'id', 'email', 'date_joined', 'updated_at', 'role', 'email_verified', 'status'
        ]


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating editable profile fields"""

    class Meta:
        model = User
        fields = ['username', 'email', 'profile_photo']

    def validate_username(self, value):
        username = value.strip()
        if len(username) < 3:
            raise serializers.ValidationError("Username must be at least 3 characters long.")
        user = self.instance
        if User.objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already exists.")
        return username

    def validate_email(self, value):
        email = value.lower().strip()
        user = self.instance
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email already exists.")
        return email

    def validate_profile_photo(self, value):
        if not value:
            return value
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError('Profile photo must be 5MB or smaller.')
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for authenticated password changes"""

    current_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if attrs['current_password'] == attrs['new_password']:
            raise serializers.ValidationError(
                {'new_password': 'New password must be different from current password.'}
            )
        return attrs


class VerifyEmailOTPSerializer(serializers.Serializer):
    """Serializer for email verification OTP submission."""

    email = serializers.EmailField(required=True)
    otp = serializers.CharField(required=True, trim_whitespace=True, max_length=6, min_length=6)

    def validate_email(self, value):
        return value.lower().strip()

    def validate_otp(self, value):
        otp = value.strip()
        if not otp.isdigit():
            raise serializers.ValidationError('OTP must contain only digits.')
        return otp


class ResendVerificationSerializer(serializers.Serializer):
    """Serializer for resend verification requests."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class ForgotPasswordSerializer(serializers.Serializer):
    """Serializer for forgot password requests."""

    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class ResetPasswordConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation."""

    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)

    def validate_new_password(self, value):
        try:
            validate_password(value)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages))
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return attrs
