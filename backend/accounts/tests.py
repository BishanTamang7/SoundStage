import re
from datetime import timedelta

from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import EmailVerificationOTP, User


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class EmailVerificationOTPFlowTests(APITestCase):
    def _register_payload(self, email='testuser@example.com'):
        return {
            'username': 'testuser',
            'email': email,
            'password': 'StrongPass123!',
            'confirm_password': 'StrongPass123!',
            'role': User.ATTENDEE,
        }

    def _extract_otp_from_mail(self):
        self.assertGreaterEqual(len(mail.outbox), 1)
        content = mail.outbox[-1].body
        match = re.search(r'(\d{6})', content)
        self.assertIsNotNone(match)
        return match.group(1)

    def test_register_creates_pending_user_and_sends_otp(self):
        response = self.client.post(reverse('accounts:register'), self._register_payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='testuser@example.com')
        self.assertFalse(user.email_verified)
        self.assertEqual(user.status, User.STATUS_PENDING_VERIFICATION)
        self.assertEqual(EmailVerificationOTP.objects.filter(user=user).count(), 1)

        otp_record = EmailVerificationOTP.objects.get(user=user)
        self.assertEqual(otp_record.attempts, 0)
        self.assertIsNone(otp_record.used_at)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('verification OTP', mail.outbox[0].subject)

    def test_login_is_blocked_until_email_verified(self):
        user = User.objects.create_user(
            email='pending@example.com',
            username='pending',
            password='StrongPass123!',
            role=User.ATTENDEE,
        )
        response = self.client.post(
            reverse('accounts:login'),
            {'email': user.email, 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('verify your email', str(response.data).lower())

    def test_verify_email_otp_marks_user_active(self):
        self.client.post(reverse('accounts:register'), self._register_payload(), format='json')
        otp = self._extract_otp_from_mail()

        response = self.client.post(
            reverse('accounts:verify_email_otp'),
            {'email': 'testuser@example.com', 'otp': otp},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user = User.objects.get(email='testuser@example.com')
        self.assertTrue(user.email_verified)
        self.assertEqual(user.status, User.STATUS_ACTIVE)
        self.assertFalse(EmailVerificationOTP.objects.filter(user=user, used_at__isnull=True).exists())

    def test_wrong_otp_attempts_then_lockout(self):
        user = User.objects.create_user(
            email='verifyme@example.com',
            username='verifyme',
            password='StrongPass123!',
            role=User.ATTENDEE,
        )
        EmailVerificationOTP.objects.create(
            user=user,
            otp_hash='dummy',
            otp_salt='salt',
            expires_at=timezone.now() + timedelta(minutes=10),
        )

        for _ in range(5):
            response = self.client.post(
                reverse('accounts:verify_email_otp'),
                {'email': user.email, 'otp': '000000'},
                format='json',
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        locked_response = self.client.post(
            reverse('accounts:verify_email_otp'),
            {'email': user.email, 'otp': '000000'},
            format='json',
        )
        self.assertEqual(locked_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_resend_otp_invalidates_old_and_sends_new(self):
        user = User.objects.create_user(
            email='resend@example.com',
            username='resenduser',
            password='StrongPass123!',
            role=User.ATTENDEE,
        )
        old_otp = EmailVerificationOTP.objects.create(
            user=user,
            otp_hash='old',
            otp_salt='salt',
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        EmailVerificationOTP.objects.filter(pk=old_otp.pk).update(
            created_at=timezone.now() - timedelta(minutes=2)
        )

        response = self.client.post(
            reverse('accounts:resend_email_otp'),
            {'email': user.email},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data.get('message'), 'If your email is valid, we sent an OTP.')
        self.assertEqual(EmailVerificationOTP.objects.filter(user=user).count(), 2)
        self.assertEqual(EmailVerificationOTP.objects.filter(user=user, used_at__isnull=True).count(), 1)
        self.assertEqual(len(mail.outbox), 1)

    def test_resend_is_rate_limited_by_cooldown(self):
        self.client.post(reverse('accounts:register'), self._register_payload('cooldown@example.com'), format='json')
        self.assertEqual(EmailVerificationOTP.objects.filter(user__email='cooldown@example.com').count(), 1)
        self.assertEqual(len(mail.outbox), 1)

        response = self.client.post(
            reverse('accounts:resend_email_otp'),
            {'email': 'cooldown@example.com'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(EmailVerificationOTP.objects.filter(user__email='cooldown@example.com').count(), 1)
        self.assertEqual(len(mail.outbox), 1)
