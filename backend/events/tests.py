from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from events.models import Concert
from events.serializers import ConcertCreateSerializer
from payments.models import PaymentTransaction
from tickets.models import Ticket, TicketCategory


class ConcertCreateSerializerTests(APITestCase):
    def _payload(self, venue='Stadium, Biratnagar'):
        return {
            'title': 'Biratnagar Live',
            'description': 'A citywide music event.',
            'date_time': (timezone.now() + timedelta(days=14)).isoformat(),
            'venue': venue,
            'main_artist': 'The Sound Crew',
            'organizer_name': 'SoundStage',
            'contact_email': 'organizer@example.com',
            'ticket_categories': [
                {'name': 'VIP', 'price': '2500.00', 'quantity': 50},
                {'name': 'Regular', 'price': '1200.00', 'quantity': 200},
            ],
        }

    def test_create_serializer_accepts_biratnagar_venue(self):
        serializer = ConcertCreateSerializer(data=self._payload())

        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_create_serializer_rejects_venue_without_city(self):
        serializer = ConcertCreateSerializer(data=self._payload(venue='Open Ground'))

        self.assertFalse(serializer.is_valid())
        self.assertIn('venue', serializer.errors)


class ConcertListApiTests(APITestCase):
    list_url = '/api/events/concerts/'

    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer@example.com',
            username='organizer',
            password='StrongPass123!',
            role=User.ORGANIZER,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        Concert.objects.create(
            organizer=self.organizer,
            title='Weekly Lineup',
            description='Newly announced concert.',
            date_time=timezone.now() + timedelta(days=5),
            venue='Arena, Kathmandu',
            main_artist='Band',
            organizer_name='SoundStage',
            contact_email='organizer@example.com',
        )
        Concert.objects.create(
            organizer=self.organizer,
            title='City Lights',
            description='Featured guest show.',
            date_time=timezone.now() + timedelta(days=7),
            venue='Weekly Arena, Kathmandu',
            main_artist='Weekly Artist',
            organizer_name='SoundStage',
            contact_email='organizer@example.com',
        )

    def test_list_endpoint_includes_created_at(self):
        response = self.client.get(self.list_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']['concerts']), 2)
        self.assertIn('created_at', response.data['data']['concerts'][0])
        self.assertIsNotNone(response.data['data']['concerts'][0]['created_at'])

    def test_list_search_matches_title_only(self):
        response = self.client.get(self.list_url, {'search': 'Weekly'})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        concerts = response.data['data']['concerts']
        self.assertEqual(len(concerts), 1)
        self.assertEqual(concerts[0]['title'], 'Weekly Lineup')


class ConcertHistoryProtectionTests(APITestCase):
    def setUp(self):
        self.organizer = User.objects.create_user(
            email='organizer-history@example.com',
            username='organizerhistory',
            password='StrongPass123!',
            role=User.ORGANIZER,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.attendee = User.objects.create_user(
            email='attendee-history@example.com',
            username='attendeehistory',
            password='StrongPass123!',
            role=User.ATTENDEE,
            email_verified=True,
            status=User.STATUS_ACTIVE,
        )
        self.concert = Concert.objects.create(
            organizer=self.organizer,
            title='History Safe Show',
            description='Keep bookings intact.',
            date_time=timezone.now() + timedelta(days=10),
            venue='Arena, Kathmandu',
            main_artist='Band',
            organizer_name='SoundStage',
            contact_email='organizer-history@example.com',
        )
        self.vip_category = TicketCategory.objects.create(
            concert=self.concert,
            name='VIP',
            price='2500.00',
            quantity=49,
        )
        self.regular_category = TicketCategory.objects.create(
            concert=self.concert,
            name='Regular',
            price='1200.00',
            quantity=200,
        )
        self.payment = PaymentTransaction.objects.create(
            attendee=self.attendee,
            concert=self.concert,
            ticket_category=self.vip_category,
            pidx='history-safe-pidx',
            purchase_order_id='history-safe-order',
            amount_paisa=250000,
            quantity=1,
            status='Completed',
            ticket_category_name_snapshot='VIP',
            ticket_unit_price_snapshot='2500.00',
            tickets_issued=True,
        )
        self.ticket = Ticket.objects.create(
            attendee=self.attendee,
            concert=self.concert,
            ticket_category=self.vip_category,
            payment_transaction=self.payment,
            qr_token='history-safe-qr',
            token_pin='4123',
        )

    def test_delete_concert_with_bookings_is_blocked(self):
        self.client.force_authenticate(user=self.organizer)

        response = self.client.delete(f'/api/events/concerts/{self.concert.id}/')

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertFalse(response.data['success'])
        self.assertIn('cannot be deleted', response.data['message'].lower())
        self.assertTrue(Concert.objects.filter(pk=self.concert.pk).exists())
        self.assertTrue(TicketCategory.objects.filter(pk=self.vip_category.pk).exists())
        self.assertTrue(PaymentTransaction.objects.filter(pk=self.payment.pk).exists())
        self.assertTrue(Ticket.objects.filter(pk=self.ticket.pk).exists())

    def test_cannot_change_sold_category_settings(self):
        self.client.force_authenticate(user=self.organizer)
        update_response = self.client.put(
            f'/api/events/concerts/{self.concert.id}/',
            {
                'title': self.concert.title,
                'description': self.concert.description,
                'genre': '',
                'date_time': self.concert.date_time.isoformat(),
                'venue': self.concert.venue,
                'main_artist': self.concert.main_artist,
                'organizer_name': self.concert.organizer_name,
                'contact_email': self.concert.contact_email,
                'contact_phone': '',
                'ticket_categories': [
                    {
                        'id': str(self.vip_category.id),
                        'name': 'VIP',
                        'price': '3000.00',
                        'quantity': 49,
                    },
                    {
                        'id': str(self.regular_category.id),
                        'name': 'Regular',
                        'price': '1200.00',
                        'quantity': 200,
                    },
                ],
            },
            format='json',
        )

        self.assertEqual(update_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cannot be changed', str(update_response.data).lower())

        self.vip_category.refresh_from_db()
        self.assertEqual(str(self.vip_category.price), '2500.00')
        self.assertEqual(self.vip_category.quantity, 49)

    def test_unsold_category_settings_can_still_be_changed(self):
        self.client.force_authenticate(user=self.organizer)
        update_response = self.client.put(
            f'/api/events/concerts/{self.concert.id}/',
            {
                'title': self.concert.title,
                'description': self.concert.description,
                'genre': '',
                'date_time': self.concert.date_time.isoformat(),
                'venue': self.concert.venue,
                'main_artist': self.concert.main_artist,
                'organizer_name': self.concert.organizer_name,
                'contact_email': self.concert.contact_email,
                'contact_phone': '',
                'ticket_categories': [
                    {
                        'id': str(self.vip_category.id),
                        'name': 'VIP',
                        'price': '2500.00',
                        'quantity': 49,
                    },
                    {
                        'id': str(self.regular_category.id),
                        'name': 'Regular',
                        'price': '1500.00',
                        'quantity': 180,
                    },
                ],
            },
            format='json',
        )

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        updated_categories = {
            category['name']: category for category in update_response.data['data']['ticket_categories']
        }
        self.assertEqual(updated_categories['Regular']['price'], '1500.00')
        self.assertEqual(updated_categories['Regular']['quantity'], 180)
