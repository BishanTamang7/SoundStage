import re
from datetime import timedelta

from django.contrib.auth.tokens import default_token_generator
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils import timezone
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken

from events.models import Concert
from payments.models import PaymentTransaction
from tickets.models import Ticket, TicketCategory

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


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class AccountLifecycleTests(APITestCase):
    def test_profile_email_change_requires_reverification(self):
        user = User.objects.create_user(
            email='verified@example.com',
            username='verifieduser',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            reverse('accounts:profile'),
            {'email': 'new-address@example.com'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertTrue(response.data['data']['requires_email_verification'])
        self.assertEqual(response.data['data']['verification_email'], 'new-address@example.com')

        user.refresh_from_db()
        self.assertEqual(user.email, 'new-address@example.com')
        self.assertFalse(user.email_verified)
        self.assertFalse(user.is_active)
        self.assertEqual(user.status, User.STATUS_PENDING_VERIFICATION)
        self.assertEqual(EmailVerificationOTP.objects.filter(user=user, used_at__isnull=True).count(), 1)
        self.assertEqual(len(mail.outbox), 1)

        login_response = self.client.post(
            reverse('accounts:login'),
            {'email': 'new-address@example.com', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('verify your email', str(login_response.data).lower())

        otp = re.search(r'(\d{6})', mail.outbox[-1].body).group(1)
        verify_response = self.client.post(
            reverse('accounts:verify_email_otp'),
            {'email': 'new-address@example.com', 'otp': otp},
            format='json',
        )
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.email_verified)
        self.assertTrue(user.is_active)
        self.assertEqual(user.status, User.STATUS_ACTIVE)

    def test_delete_attendee_account_removes_user_and_preserves_ticket_records(self):
        organizer = User.objects.create_user(
            email='organizer@example.com',
            username='organizer',
            password='StrongPass123!',
            role=User.ORGANIZER,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        attendee = User.objects.create_user(
            email='attendee@example.com',
            username='attendee',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        concert = Concert.objects.create(
            organizer=organizer,
            title='Preserved Show',
            description='Concert data should remain.',
            date_time=timezone.now() + timedelta(days=10),
            venue='Arena, Kathmandu',
            main_artist='Band',
            organizer_name='Organizer',
            contact_email='organizer@example.com',
        )
        category = TicketCategory.objects.create(
            concert=concert,
            name='VIP',
            price='50.00',
            quantity=100,
        )
        payment = PaymentTransaction.objects.create(
            attendee=attendee,
            concert=concert,
            ticket_category=category,
            pidx='delete-check-pidx',
            purchase_order_id='delete-check-order',
            amount_paisa=5000,
            quantity=1,
            status='Completed',
            tickets_issued=True,
        )
        ticket = Ticket.objects.create(
            attendee=attendee,
            concert=concert,
            ticket_category=category,
            payment_transaction=payment,
            qr_token='delete-check-qr',
            token_pin='4832',
        )

        self.client.force_authenticate(user=attendee)
        response = self.client.delete(reverse('accounts:profile'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        self.assertFalse(User.objects.filter(pk=attendee.pk).exists())
        self.assertTrue(Concert.objects.filter(pk=concert.pk).exists())
        self.assertTrue(TicketCategory.objects.filter(pk=category.pk).exists())
        self.assertTrue(PaymentTransaction.objects.filter(pk=payment.pk).exists())
        self.assertTrue(Ticket.objects.filter(pk=ticket.pk).exists())

        ticket.refresh_from_db()
        payment.refresh_from_db()
        self.assertIsNone(ticket.attendee)
        self.assertIsNone(payment.attendee)

        login_response = self.client.post(
            reverse('accounts:login'),
            {'email': 'attendee@example.com', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('invalid email. no account found with this email', str(login_response.data).lower())

    def test_login_for_suspended_user_returns_disabled_message(self):
        user = User.objects.create_user(
            email='disabled@example.com',
            username='disableduser',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
            is_active=False,
        )

        response = self.client.post(
            reverse('accounts:login'),
            {'email': user.email, 'password': 'StrongPass123!'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn('disabled', str(response.data).lower())


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class PasswordTokenRevocationTests(APITestCase):
    def test_reset_password_blacklists_existing_refresh_tokens(self):
        user = User.objects.create_user(
            email='reset@example.com',
            username='resetuser',
            password='OldStrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        refresh = RefreshToken.for_user(user)

        response = self.client.post(
            reverse('accounts:reset_password_confirm'),
            {
                'uid': urlsafe_base64_encode(force_bytes(user.pk)),
                'token': default_token_generator.make_token(user),
                'new_password': 'NewStrongPass123!',
                'confirm_password': 'NewStrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewStrongPass123!'))
        self.assertTrue(
            BlacklistedToken.objects.filter(token__user=user, token__token=str(refresh)).exists()
        )

    def test_change_password_blacklists_existing_refresh_tokens(self):
        user = User.objects.create_user(
            email='change@example.com',
            username='changeuser',
            password='OldStrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        refresh = RefreshToken.for_user(user)
        self.client.force_authenticate(user=user)

        response = self.client.post(
            reverse('accounts:change_password'),
            {
                'current_password': 'OldStrongPass123!',
                'new_password': 'NewStrongPass123!',
                'confirm_password': 'NewStrongPass123!',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password('NewStrongPass123!'))
        self.assertTrue(
            BlacklistedToken.objects.filter(token__user=user, token__token=str(refresh)).exists()
        )
