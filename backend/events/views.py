import logging
import threading

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.utils.timezone import localtime
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsOrganizer
from events.models import Concert
from .serializers import ConcertCreateSerializer, ConcertDetailSerializer, ConcertListSerializer

logger = logging.getLogger(__name__)


def _send_new_concert_announcement(concert):
    User = get_user_model()
    recipients = (
        User.objects.filter(
            role='ATTENDEE',
            is_active=True,
            email_verified=True,
        )
        .exclude(email__isnull=True)
        .exclude(email='')
        .exclude(notification_preferences__event_reminders=False)
        .values_list('email', flat=True)
        .distinct()
    )

    recipient_list = list(recipients)
    if not recipient_list:
        return

    concert_url = f"{settings.FRONTEND_URL.rstrip('/')}/attendee/concerts/{concert.id}"
    concert_dt = (
        localtime(concert.date_time).strftime('%Y-%m-%d %I:%M %p')
        if concert.date_time else ''
    )

    subject = f'New concert on SoundStage: {concert.title}'
    message = (
        'A new concert has been added to SoundStage.\n\n'
        f'Title: {concert.title}\n'
        f'Artist: {concert.main_artist}\n'
        f'Date & Time: {concert_dt}\n'
        f'Venue: {concert.venue}\n\n'
        f'View concert: {concert_url}\n'
    )

    for email in recipient_list:
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def _send_new_concert_announcement_async(concert_id):
    def _worker():
        try:
            concert = Concert.objects.filter(id=concert_id).first()
            if concert:
                _send_new_concert_announcement(concert)
        except Exception:
            logger.exception('Failed to send new concert announcement for concert %s', concert_id)

    transaction.on_commit(lambda: threading.Thread(target=_worker, daemon=True).start())


class ConcertViewSet(viewsets.ModelViewSet):
    queryset = Concert.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.action in ['retrieve', 'my_events']:
            return ConcertDetailSerializer.setup_eager_loading(queryset)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return ConcertCreateSerializer
        if self.action in ['retrieve', 'update', 'partial_update']:
            return ConcertDetailSerializer
        return ConcertListSerializer

    def get_permissions(self):
        if self.action == 'list':
            return [AllowAny()]
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOrganizer()]
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        concert = serializer.save(organizer=request.user)
        _send_new_concert_announcement_async(concert.id)
        return Response(
            {
                'success': True,
                'message': 'Concert created successfully',
                'data': {
                    'concert_id': str(concert.id),
                    'title': concert.title,
                    'created_at': concert.created_at,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'success': True, 'data': {'concerts': serializer.data}})

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({'success': True, 'data': serializer.data})

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if instance.organizer != request.user:
            return Response(
                {
                    'success': False,
                    'message': 'You do not have permission to edit this concert',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        concert = serializer.save()
        response_serializer = ConcertDetailSerializer(concert)

        return Response(
            {
                'success': True,
                'message': 'Concert updated successfully',
                'data': response_serializer.data,
            }
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.organizer != request.user:
            return Response(
                {
                    'success': False,
                    'message': 'You do not have permission to delete this concert',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if instance.payment_transactions.exists():
            return Response(
                {
                    'success': False,
                    'message': 'Concerts with booking history cannot be deleted.',
                },
                status=status.HTTP_409_CONFLICT,
            )

        instance.delete()
        return Response(
            {'success': True, 'message': 'Concert deleted successfully'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsOrganizer])
    def my_events(self, request):
        queryset = self.get_queryset().filter(organizer=request.user)
        serializer = ConcertDetailSerializer(queryset, many=True)
        return Response({'success': True, 'data': {'concerts': serializer.data}})
