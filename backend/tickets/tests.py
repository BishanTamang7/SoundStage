from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from events.models import Concert
from payments.models import PaymentTransaction
from tickets.models import Ticket, TicketCategory


class VerifyTicketTests(APITestCase):
    verify_url = '/api/tickets/verify/'

    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            username='organizer',
            password='StrongPass123!',
            role=User.ORGANIZER,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.attendee = User.objects.create_user(
            email='attendee@example.com',
            username='attendee',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.concert = Concert.objects.create(
            organizer=self.organizer,
            title='Spring Fest',
            description='Live show',
            date_time=timezone.now() + timedelta(days=7),
            venue='Pokhara',
            main_artist='Band',
            organizer_name='Organizer',
            contact_email='organizer@example.com',
        )
        self.regular_category = TicketCategory.objects.create(
            concert=self.concert,
            name='Regular',
            price='20.00',
            quantity=100,
        )
        self.vip_category = TicketCategory.objects.create(
            concert=self.concert,
            name='VIP',
            price='50.00',
            quantity=100,
        )

    def _create_booking(self, *, category, token_pin, purchase_order_id, pidx, amount_paisa, quantity=1, created_at):
        payment = PaymentTransaction.objects.create(
            attendee=self.attendee,
            concert=self.concert,
            ticket_category=category,
            pidx=pidx,
            purchase_order_id=purchase_order_id,
            amount_paisa=amount_paisa,
            quantity=quantity,
            status='Completed',
            tickets_issued=True,
        )
        PaymentTransaction.objects.filter(pk=payment.pk).update(created_at=created_at, updated_at=created_at)
        payment.refresh_from_db()

        tickets = []
        for index in range(quantity):
            ticket = Ticket.objects.create(
                attendee=self.attendee,
                concert=self.concert,
                ticket_category=category,
                payment_transaction=payment,
                qr_token=f'{purchase_order_id}-{index}',
                token_pin=token_pin if index == 0 else f'{int(token_pin) + index:04d}',
            )
            tickets.append(ticket)
        Ticket.objects.filter(payment_transaction=payment).update(created_at=created_at)
        refreshed_tickets = [Ticket.objects.get(pk=ticket.pk) for ticket in tickets]
        return payment, refreshed_tickets

    def test_verify_ticket_aggregates_related_group_and_confirms_all(self):
        first_time = timezone.now() - timedelta(hours=3)
        second_time = timezone.now() - timedelta(hours=2)
        third_time = timezone.now() - timedelta(hours=1)

        regular_bookings = [
            self._create_booking(
                category=self.regular_category,
                token_pin='6091',
                purchase_order_id='regular-1',
                pidx='pidx-regular-1',
                amount_paisa=2000,
                created_at=first_time,
            ),
            self._create_booking(
                category=self.regular_category,
                token_pin='7002',
                purchase_order_id='regular-2',
                pidx='pidx-regular-2',
                amount_paisa=2000,
                created_at=second_time,
            ),
            self._create_booking(
                category=self.regular_category,
                token_pin='8113',
                purchase_order_id='regular-3',
                pidx='pidx-regular-3',
                amount_paisa=2000,
                created_at=third_time,
            ),
        ]
        self._create_booking(
            category=self.vip_category,
            token_pin='9224',
            purchase_order_id='vip-1',
            pidx='pidx-vip-1',
            amount_paisa=5000,
            quantity=2,
            created_at=timezone.now() - timedelta(minutes=30),
        )

        self.client.force_authenticate(user=self.organizer)

        verify_response = self.client.post(
            self.verify_url,
            {'qr_token': '6091', 'confirm_entry': False},
            format='json',
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_response.data['success'])
        self.assertTrue(verify_response.data['requires_confirmation'])
        self.assertEqual(verify_response.data['data']['total_booking_quantity'], 3)
        self.assertEqual(verify_response.data['data']['total_amount'], 'NPR 60')
        self.assertEqual(verify_response.data['data']['ticket_type'], 'Regular')
        self.assertEqual(verify_response.data['data']['token'], '6091')
        self.assertEqual(verify_response.data['data']['booked_at'].count(' | '), 2)

        confirm_response = self.client.post(
            self.verify_url,
            {'qr_token': '6091', 'confirm_entry': True},
            format='json',
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertTrue(confirm_response.data['success'])
        self.assertEqual(confirm_response.data['data']['total_booking_quantity'], 3)
        self.assertEqual(confirm_response.data['data']['total_amount'], 'NPR 60')

        for _, tickets in regular_bookings:
            for ticket in tickets:
                ticket.refresh_from_db()
                self.assertTrue(ticket.is_used)
                self.assertEqual(ticket.used_by, self.organizer)

        vip_tickets = Ticket.objects.filter(ticket_category=self.vip_category)
        self.assertTrue(vip_tickets.exists())
        self.assertFalse(vip_tickets.filter(is_used=True).exists())

    def test_verify_ticket_uses_payment_quantity_for_legacy_single_row_booking(self):
        created_at = timezone.now() - timedelta(hours=1)
        payment, tickets = self._create_booking(
            category=self.vip_category,
            token_pin='8082',
            purchase_order_id='vip-legacy',
            pidx='pidx-vip-legacy',
            amount_paisa=5000,
            quantity=2,
            created_at=created_at,
        )
        Ticket.objects.filter(payment_transaction=payment).exclude(id=tickets[0].id).delete()

        self.client.force_authenticate(user=self.organizer)

        verify_response = self.client.post(
            self.verify_url,
            {'qr_token': '8082', 'confirm_entry': False},
            format='json',
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_response.data['success'])
        self.assertEqual(verify_response.data['data']['total_booking_quantity'], 2)
        self.assertEqual(verify_response.data['data']['total_amount'], 'NPR 50')

    def test_verify_ticket_shows_full_group_for_partially_used_booking(self):
        created_at = timezone.now() - timedelta(hours=1)
        payment, tickets = self._create_booking(
            category=self.vip_category,
            token_pin='8082',
            purchase_order_id='vip-partial',
            pidx='pidx-vip-partial',
            amount_paisa=5000,
            quantity=2,
            created_at=created_at,
        )
        used_ticket = tickets[0]
        used_ticket.is_used = True
        used_ticket.used_at = timezone.now() - timedelta(minutes=5)
        used_ticket.used_by = self.organizer
        used_ticket.save(update_fields=['is_used', 'used_at', 'used_by'])

        self.client.force_authenticate(user=self.organizer)

        verify_response = self.client.post(
            self.verify_url,
            {'qr_token': '8082', 'confirm_entry': False},
            format='json',
        )

        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertTrue(verify_response.data['success'])
        self.assertTrue(verify_response.data['requires_confirmation'])
        self.assertEqual(verify_response.data['data']['total_booking_quantity'], 2)
        self.assertEqual(verify_response.data['data']['total_amount'], 'NPR 50')
        self.assertIn('1 of 2 tickets already used', verify_response.data['message'])

        confirm_response = self.client.post(
            self.verify_url,
            {'qr_token': '8082', 'confirm_entry': True},
            format='json',
        )

        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)
        self.assertTrue(confirm_response.data['success'])
        self.assertEqual(confirm_response.data['data']['total_booking_quantity'], 2)
        self.assertEqual(confirm_response.data['data']['total_amount'], 'NPR 50')

        for ticket in Ticket.objects.filter(payment_transaction=payment):
            ticket.refresh_from_db()
            self.assertTrue(ticket.is_used)


class TicketHistoryPreservationTests(APITestCase):
    delete_url_template = '/api/tickets/{ticket_id}/'

    def setUp(self):
        self.attendee = User.objects.create_user(
            email='attendee-history@example.com',
            username='attendeehistory',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.organizer = User.objects.create_user(
            email='organizer-history@example.com',
            username='organizerhistory',
            password='StrongPass123!',
            role=User.ORGANIZER,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.concert = Concert.objects.create(
            organizer=self.organizer,
            title='History Fest',
            description='Ticket history should be preserved.',
            date_time=timezone.now() - timedelta(days=2),
            venue='Kathmandu',
            main_artist='Band',
            organizer_name='Organizer',
            contact_email='organizer-history@example.com',
        )
        self.category = TicketCategory.objects.create(
            concert=self.concert,
            name='Regular',
            price='20.00',
            quantity=100,
        )
        self.payment = PaymentTransaction.objects.create(
            attendee=self.attendee,
            concert=self.concert,
            ticket_category=self.category,
            pidx='history-preserve-pidx',
            purchase_order_id='history-preserve-order',
            amount_paisa=2000,
            quantity=1,
            status='Completed',
            tickets_issued=True,
        )
        self.ticket = Ticket.objects.create(
            attendee=self.attendee,
            concert=self.concert,
            ticket_category=self.category,
            payment_transaction=self.payment,
            qr_token='history-ticket-qr',
            token_pin='4021',
        )

    def test_delete_ticket_endpoint_preserves_ticket_history(self):
        self.client.force_authenticate(user=self.attendee)

        response = self.client.delete(
            self.delete_url_template.format(ticket_id=self.ticket.id),
        )

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(response.data['success'])
        self.assertIn('cannot be deleted', response.data['message'].lower())
        self.assertTrue(Ticket.objects.filter(pk=self.ticket.pk).exists())

    def test_delete_ticket_endpoint_keeps_ticket_visible_in_history(self):
        self.client.force_authenticate(user=self.attendee)

        self.client.delete(self.delete_url_template.format(ticket_id=self.ticket.id))
        tickets_response = self.client.get('/api/tickets/my/')

        self.assertEqual(tickets_response.status_code, status.HTTP_200_OK)
        returned_ids = {str(ticket['id']) for ticket in tickets_response.data['data']['tickets']}
        self.assertIn(str(self.ticket.id), returned_ids)
