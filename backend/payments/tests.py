from datetime import timedelta
from unittest.mock import patch

from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from events.models import Concert
from payments.models import PaymentTransaction
from tickets.models import Ticket, TicketCategory


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class KhaltiReservationFlowTests(APITestCase):
    initiate_url = '/api/payments/khalti/initiate/'
    confirm_url = '/api/payments/khalti/confirm/'

    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer-payments@example.com',
            username='organizerpayments',
            password='StrongPass123!',
            role=User.ORGANIZER,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.attendee = User.objects.create_user(
            email='attendee-payments@example.com',
            username='attendeepayments',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.concert = Concert.objects.create(
            organizer=self.organizer,
            title='Reserved Stock Show',
            description='Reservation flow test.',
            date_time=timezone.now() + timedelta(days=5),
            venue='Arena, Kathmandu',
            main_artist='Band',
            organizer_name='Organizer',
            contact_email='organizer-payments@example.com',
        )
        self.ticket_category = TicketCategory.objects.create(
            concert=self.concert,
            name='VIP',
            price='1200.00',
            quantity=5,
        )
        self.client.force_authenticate(user=self.attendee)

    def test_past_concert_purchase_is_rejected(self):
        past_concert = Concert.objects.create(
            organizer=self.organizer,
            title='Past Show',
            description='Should not be purchasable.',
            date_time=timezone.now() - timedelta(days=1),
            venue='Arena, Kathmandu',
            main_artist='Band',
            organizer_name='Organizer',
            contact_email='organizer-payments@example.com',
        )
        past_category = TicketCategory.objects.create(
            concert=past_concert,
            name='VIP',
            price='1200.00',
            quantity=5,
        )

        response = self.client.post(
            self.initiate_url,
            {
                'concert_id': str(past_concert.id),
                'ticket_category_id': str(past_category.id),
                'quantity': 1,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('past concerts', response.data['detail'].lower())

    @patch('payments.views._khalti_request')
    def test_initiate_reserves_stock_and_confirm_does_not_double_decrement(self, mock_khalti_request):
        mock_khalti_request.side_effect = [
            {
                'ok': True,
                'status': status.HTTP_200_OK,
                'data': {
                    'pidx': 'pidx-reserve-1',
                    'payment_url': 'https://khalti.test/pay',
                    'status': 'Initiated',
                },
            },
            {
                'ok': True,
                'status': status.HTTP_200_OK,
                'data': {
                    'pidx': 'pidx-reserve-1',
                    'status': 'Completed',
                    'transaction_id': 'txn-1',
                },
            },
        ]

        initiate_response = self.client.post(
            self.initiate_url,
            {
                'concert_id': str(self.concert.id),
                'ticket_category_id': str(self.ticket_category.id),
                'quantity': 2,
            },
            format='json',
        )

        self.assertEqual(initiate_response.status_code, status.HTTP_200_OK)
        self.ticket_category.refresh_from_db()
        self.assertEqual(self.ticket_category.quantity, 3)

        payment = PaymentTransaction.objects.get(pidx='pidx-reserve-1')
        self.assertTrue(payment.stock_reserved)
        self.assertIsNotNone(payment.reservation_expires_at)

        confirm_response = self.client.post(
            self.confirm_url,
            {'pidx': 'pidx-reserve-1'},
            format='json',
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_response.data['data']['status'], 'Completed')
        self.assertEqual(len(confirm_response.data['data']['tickets']), 2)

        self.ticket_category.refresh_from_db()
        payment.refresh_from_db()
        self.assertEqual(self.ticket_category.quantity, 3)
        self.assertFalse(payment.stock_reserved)
        self.assertIsNone(payment.reservation_expires_at)
        self.assertTrue(payment.tickets_issued)
        self.assertEqual(payment.transaction_id, 'txn-1')
        self.assertEqual(Ticket.objects.filter(payment_transaction=payment).count(), 2)

    @patch('payments.views._khalti_request')
    def test_confirm_releases_reserved_stock_for_canceled_payment(self, mock_khalti_request):
        mock_khalti_request.side_effect = [
            {
                'ok': True,
                'status': status.HTTP_200_OK,
                'data': {
                    'pidx': 'pidx-cancel-1',
                    'payment_url': 'https://khalti.test/pay',
                    'status': 'Initiated',
                },
            },
            {
                'ok': True,
                'status': status.HTTP_200_OK,
                'data': {
                    'pidx': 'pidx-cancel-1',
                    'status': 'User canceled',
                },
            },
        ]

        initiate_response = self.client.post(
            self.initiate_url,
            {
                'concert_id': str(self.concert.id),
                'ticket_category_id': str(self.ticket_category.id),
                'quantity': 1,
            },
            format='json',
        )

        self.assertEqual(initiate_response.status_code, status.HTTP_200_OK)
        self.ticket_category.refresh_from_db()
        self.assertEqual(self.ticket_category.quantity, 4)

        confirm_response = self.client.post(
            self.confirm_url,
            {'pidx': 'pidx-cancel-1'},
            format='json',
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirm_response.data['data']['status'], 'User canceled')
        self.assertEqual(confirm_response.data['data']['tickets'], [])

        self.ticket_category.refresh_from_db()
        payment = PaymentTransaction.objects.get(pidx='pidx-cancel-1')
        self.assertEqual(self.ticket_category.quantity, 5)
        self.assertFalse(payment.stock_reserved)
        self.assertFalse(payment.tickets_issued)
