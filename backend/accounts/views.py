import hashlib
import hmac
import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.db import transaction
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationOTP, User
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    ResetPasswordConfirmSerializer,
    ResendVerificationSerializer,
    UserLoginSerializer,
    UserProfileUpdateSerializer,
    UserRegistrationSerializer,
    UserSerializer,
    VerifyEmailOTPSerializer,
)


logger = logging.getLogger(__name__)

OTP_LENGTH = 6
OTP_EXPIRY_MINUTES = 10
OTP_MAX_ATTEMPTS = 5
OTP_LOCK_MINUTES = 15
RESEND_MIN_INTERVAL_SECONDS = 60
RESEND_MAX_PER_HOUR = 5
GENERIC_RESEND_MESSAGE = 'If your email is valid, we sent an OTP.'
GENERIC_PASSWORD_RESET_MESSAGE = (
    'If an account with that email exists, a password reset link has been sent.'
)


def _hash_otp(otp, salt):
    return hashlib.sha256(f'{salt}:{otp}'.encode('utf-8')).hexdigest()


def _generate_otp():
    return f'{secrets.randbelow(10**OTP_LENGTH):0{OTP_LENGTH}d}'


def _send_otp_email(user, otp):
    ttl_minutes = getattr(settings, 'EMAIL_VERIFICATION_OTP_TTL_MINUTES', OTP_EXPIRY_MINUTES)
    subject = 'Your SoundStage email verification OTP'
    message = (
        f"Hi {user.username},\n\n"
        f"Your verification OTP is: {otp}\n\n"
        f"This OTP expires in {ttl_minutes} minutes.\n"
        f"If this wasn't you, you can ignore this email.\n"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def _send_password_reset_email(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    reset_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}/reset-password"
        f"?uid={uid}&token={token}&email={user.email}"
    )
    subject = 'Reset your SoundStage password'
    message = (
        f"Hi {user.username},\n\n"
        "We received a request to reset your SoundStage password.\n\n"
        f"Reset your password here: {reset_url}\n\n"
        "If you did not request this, you can ignore this email.\n"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=False)


def _otp_resend_counts(user):
    now = timezone.now()
    one_minute_ago = now - timedelta(seconds=RESEND_MIN_INTERVAL_SECONDS)
    one_hour_ago = now - timedelta(hours=1)

    sent_recently = EmailVerificationOTP.objects.filter(
        user=user,
        created_at__gte=one_minute_ago,
    ).exists()
    sent_in_hour = EmailVerificationOTP.objects.filter(
        user=user,
        created_at__gte=one_hour_ago,
    ).count()
    return sent_recently, sent_in_hour


def _issue_and_send_otp(user):
    sent_recently, sent_in_hour = _otp_resend_counts(user)
    if sent_recently or sent_in_hour >= RESEND_MAX_PER_HOUR:
        return False

    now = timezone.now()
    EmailVerificationOTP.objects.filter(user=user, used_at__isnull=True).update(used_at=now)

    otp = _generate_otp()
    salt = secrets.token_hex(16)
    otp_hash = _hash_otp(otp, salt)
    ttl_minutes = getattr(settings, 'EMAIL_VERIFICATION_OTP_TTL_MINUTES', OTP_EXPIRY_MINUTES)
    expires_at = now + timedelta(minutes=ttl_minutes)
    resend_count = sent_in_hour + 1

    EmailVerificationOTP.objects.create(
        user=user,
        otp_hash=otp_hash,
        otp_salt=salt,
        expires_at=expires_at,
        resend_count=resend_count,
    )
    _send_otp_email(user, otp)
    return True


class UserRegistrationAPIView(APIView):
    """API endpoint for user registration."""

    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            try:
                _issue_and_send_otp(user)
            except Exception:
                logger.exception('Failed to send verification OTP during registration for user %s', user.id)

            return Response(
                {
                    'success': True,
                    'message': 'User registered successfully. Please enter the OTP sent to your email.',
                    'data': {'user': serializer.data},
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'success': False,
                'message': 'Validation error',
                'errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class VerifyEmailOTPAPIView(APIView):
    """API endpoint to verify email OTP."""

    permission_classes = [AllowAny]
    serializer_class = VerifyEmailOTPSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'Validation error', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data['email']
        otp_input = serializer.validated_data['otp']
        now = timezone.now()

        with transaction.atomic():
            user = User.objects.select_for_update().filter(email__iexact=email).first()
            if not user or user.email_verified:
                return Response(
                    {'success': False, 'message': 'Invalid OTP.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            otp_record = (
                EmailVerificationOTP.objects.select_for_update()
                .filter(user=user, used_at__isnull=True)
                .order_by('-created_at')
                .first()
            )
            if not otp_record:
                return Response(
                    {'success': False, 'message': 'Invalid OTP.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if otp_record.locked_until and otp_record.locked_until > now:
                return Response(
                    {'success': False, 'message': 'Too many attempts. Please request a new OTP later.'},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            if otp_record.expires_at <= now:
                return Response(
                    {'success': False, 'message': 'OTP expired. Please request a new OTP.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            expected_hash = _hash_otp(otp_input, otp_record.otp_salt)
            if not hmac.compare_digest(expected_hash, otp_record.otp_hash):
                otp_record.attempts += 1
                if otp_record.attempts >= OTP_MAX_ATTEMPTS:
                    otp_record.locked_until = now + timedelta(minutes=OTP_LOCK_MINUTES)
                otp_record.save(update_fields=['attempts', 'locked_until'])
                return Response(
                    {'success': False, 'message': 'Invalid OTP.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.email_verified = True
            user.status = User.STATUS_ACTIVE
            user.save(update_fields=['email_verified', 'status', 'updated_at'])

            otp_record.used_at = now
            otp_record.save(update_fields=['used_at'])
            EmailVerificationOTP.objects.filter(
                user=user,
                used_at__isnull=True,
            ).exclude(pk=otp_record.pk).update(used_at=now)

        return Response(
            {'success': True, 'message': 'Email verified successfully.'},
            status=status.HTTP_200_OK,
        )


class ResendEmailOTPAPIView(APIView):
    """API endpoint to resend email OTP."""

    permission_classes = [AllowAny]
    serializer_class = ResendVerificationSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': True, 'message': GENERIC_RESEND_MESSAGE},
                status=status.HTTP_200_OK,
            )

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()
        if not user or user.email_verified:
            return Response(
                {'success': True, 'message': GENERIC_RESEND_MESSAGE},
                status=status.HTTP_200_OK,
            )

        try:
            _issue_and_send_otp(user)
        except Exception:
            logger.exception('Failed to resend verification OTP for user %s', user.id)

        return Response(
            {'success': True, 'message': GENERIC_RESEND_MESSAGE},
            status=status.HTTP_200_OK,
        )


class ForgotPasswordAPIView(APIView):
    """API endpoint to request a password reset link."""

    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': True, 'message': GENERIC_PASSWORD_RESET_MESSAGE},
                status=status.HTTP_200_OK,
            )

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user:
            try:
                _send_password_reset_email(user)
            except Exception:
                logger.exception('Failed to send password reset email for user %s', user.id)

        return Response(
            {'success': True, 'message': GENERIC_PASSWORD_RESET_MESSAGE},
            status=status.HTTP_200_OK,
        )


class ResetPasswordConfirmAPIView(APIView):
    """API endpoint to reset password using uid/token."""

    permission_classes = [AllowAny]
    serializer_class = ResetPasswordConfirmSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'success': False, 'message': 'Validation error', 'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.filter(pk=user_id, is_active=True).first()
        except Exception:
            user = None

        if not user or not default_token_generator.check_token(user, token):
            return Response(
                {'success': False, 'message': 'Invalid or expired password reset link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=['password'])

        return Response(
            {'success': True, 'message': 'Password reset successfully. You can log in now.'},
            status=status.HTTP_200_OK,
        )


class UserLoginAPIView(APIView):
    """API endpoint for user login."""

    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            user_data = UserSerializer(user, context={'request': request}).data
            return Response(
                {
                    'success': True,
                    'message': 'Login successful',
                    'data': {
                        'user': user_data,
                        'tokens': {
                            'access': serializer.validated_data['access'],
                            'refresh': serializer.validated_data['refresh'],
                        },
                    },
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {'success': False, 'message': 'Authentication failed', 'errors': serializer.errors},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class UserLogoutAPIView(APIView):
    """API endpoint for user logout (token blacklisting)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response(
                    {'success': False, 'message': 'Refresh token is required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'success': True, 'message': 'Logout successful'},
                status=status.HTTP_200_OK,
            )

        except TokenError:
            return Response(
                {'success': False, 'message': 'Invalid or expired token'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {'success': False, 'message': 'Logout failed'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserProfileAPIView(APIView):
    """API endpoint to get authenticated user profile."""

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def get(self, request):
        serializer = self.serializer_class(request.user, context={'request': request})
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            response_serializer = self.serializer_class(request.user, context={'request': request})
            return Response(
                {
                    'success': True,
                    'message': 'Profile updated successfully',
                    'data': response_serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {'success': False, 'message': 'Validation error', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request):
        try:
            request.user.delete()
            return Response(
                {'success': True, 'message': 'Account deleted successfully'},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {'success': False, 'message': 'Failed to delete account'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ChangePasswordAPIView(APIView):
    """API endpoint to update authenticated user password."""

    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save(update_fields=['password'])
            return Response(
                {'success': True, 'message': 'Password updated successfully'},
                status=status.HTTP_200_OK,
            )

        return Response(
            {'success': False, 'message': 'Validation error', 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )
