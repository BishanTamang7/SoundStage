import json
from decimal import Decimal

from django.db.models import Count, Prefetch, Sum
from django.utils import timezone
from django.utils.datastructures import MultiValueDict
from rest_framework import serializers

from events.constants import ALLOWED_CONCERT_CITIES
from events.models import Concert
from tickets.models import TicketCategory

ALLOWED_TICKET_CATEGORY_NAMES = {'vip', 'regular'}


def _validate_concert_venue_city(value):
    venue = (value or '').strip()
    normalized_venue = venue.lower()
    if any(city in normalized_venue for city in ALLOWED_CONCERT_CITIES):
        return venue

    parts = [part.strip() for part in venue.split(',') if part.strip()]
    if len(parts) >= 2 and parts[-1]:
        return venue

    allowed_cities = ', '.join(city.title() for city in ALLOWED_CONCERT_CITIES)
    raise serializers.ValidationError(
        f'Venue must include a city. Use one of: {allowed_cities}, or select Other and enter a city.'
    )


def _normalize_ticket_category_name(name):
    value = str(name or '').strip().lower()
    if value not in ALLOWED_TICKET_CATEGORY_NAMES:
        raise serializers.ValidationError({'ticket_categories': 'Only VIP and Regular ticket types are allowed.'})
    return 'VIP' if value == 'vip' else 'Regular'


def _validate_and_normalize_ticket_categories(ticket_categories_data):
    if not isinstance(ticket_categories_data, list) or len(ticket_categories_data) != 2:
        raise serializers.ValidationError({'ticket_categories': 'Exactly two ticket categories are required: VIP and Regular.'})

    normalized = []
    seen = set()
    for raw_category in ticket_categories_data:
        payload = dict(raw_category)
        normalized_name = _normalize_ticket_category_name(payload.get('name'))
        key = normalized_name.lower()
        if key in seen:
            raise serializers.ValidationError({'ticket_categories': 'VIP and Regular must each appear once.'})
        seen.add(key)
        payload['name'] = normalized_name
        normalized.append(payload)

    if seen != ALLOWED_TICKET_CATEGORY_NAMES:
        raise serializers.ValidationError({'ticket_categories': 'Both VIP and Regular categories are required.'})

    return normalized


def _clone_input_payload(data):
    if isinstance(data, MultiValueDict) or hasattr(data, 'getlist'):
        return data.copy()
    if isinstance(data, dict):
        return dict(data)
    return data.copy() if hasattr(data, 'copy') else data


def _decode_ticket_categories_payload(raw_categories, *, invalid_message=None):
    if isinstance(raw_categories, str):
        try:
            return json.loads(raw_categories)
        except json.JSONDecodeError:
            if invalid_message:
                raise serializers.ValidationError({'ticket_categories': invalid_message})
            return raw_categories
    return raw_categories


def _normalize_concert_input_payload(data, *, blank_optional_fields=()):
    mutable_data = _clone_input_payload(data)
    if not hasattr(mutable_data, 'get'):
        return mutable_data

    raw_categories = mutable_data.get('ticket_categories')
    decoded_categories = _decode_ticket_categories_payload(raw_categories)
    if decoded_categories is not raw_categories:
        mutable_data['ticket_categories'] = decoded_categories

    for key in blank_optional_fields:
        value = mutable_data.get(key)
        if value is None or (isinstance(value, str) and not value.strip()):
            if hasattr(mutable_data, 'pop'):
                mutable_data.pop(key, None)

    return mutable_data


def _get_request_ticket_categories(serializer, *, invalid_message=None):
    raw_categories = None
    if hasattr(serializer, 'initial_data'):
        raw_categories = serializer.initial_data.get('ticket_categories')

    if raw_categories is None:
        request = serializer.context.get('request')
        if request is not None:
            raw_categories = request.data.get('ticket_categories')

    if raw_categories is None:
        return None

    return _decode_ticket_categories_payload(raw_categories, invalid_message=invalid_message)


class TicketCategorySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    sold = serializers.SerializerMethodField()
    remaining = serializers.IntegerField(source='quantity', read_only=True)
    capacity = serializers.SerializerMethodField()
    revenue = serializers.SerializerMethodField()

    class Meta:
        model = TicketCategory
        fields = ['id', 'name', 'price', 'quantity', 'remaining', 'sold', 'capacity', 'revenue']

    def _get_sold_count(self, obj):
        annotated_count = getattr(obj, 'sold_count', None)
        if annotated_count is not None:
            return int(annotated_count)
        return obj.tickets.count()

    def get_sold(self, obj):
        return self._get_sold_count(obj)

    def get_capacity(self, obj):
        return int(obj.quantity) + self._get_sold_count(obj)

    def get_revenue(self, obj):
        revenue_paisa = getattr(obj, 'revenue_paisa', None)
        if revenue_paisa is None:
            revenue_paisa = obj.payment_transactions.filter(status='Completed').aggregate(
                total=Sum('amount_paisa')
            ).get('total', 0)
        return Decimal(revenue_paisa or 0) / Decimal('100')


class BaseConcertWriteSerializer(serializers.ModelSerializer):
    ticket_categories = TicketCategorySerializer(many=True, required=False)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)

    blank_optional_fields = ()

    def to_internal_value(self, data):
        mutable_data = _normalize_concert_input_payload(
            data,
            blank_optional_fields=self.blank_optional_fields,
        )
        return super().to_internal_value(mutable_data)

    def validate_venue(self, value):
        return _validate_concert_venue_city(value)

    def validate_date_time(self, value):
        # Block concerts scheduled in the past (based on current server time).
        now = timezone.now()
        candidate = value
        if timezone.is_naive(candidate):
            candidate = timezone.make_aware(candidate, timezone.get_current_timezone())
        if candidate < now:
            raise serializers.ValidationError('Date & Time must be in the future.')
        return value


class ConcertCreateSerializer(BaseConcertWriteSerializer):
    blank_optional_fields = ('organizer_name', 'contact_email')

    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'genre', 'genre_display', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email', 'contact_phone',
            'ticket_categories', 'cover_image'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'organizer_name': {'required': False},
            'contact_email': {'required': False},
        }

    def create(self, validated_data):
        ticket_categories_data = validated_data.pop('ticket_categories', None)
        if ticket_categories_data is None:
            ticket_categories_data = _get_request_ticket_categories(self)

        if not ticket_categories_data:
            raise serializers.ValidationError({'ticket_categories': 'This field is required.'})
        ticket_categories_data = _validate_and_normalize_ticket_categories(ticket_categories_data)

        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user and request.user.is_authenticated:
            organizer_name = request.user.get_full_name() or request.user.username or request.user.email
            validated_data.setdefault('organizer_name', organizer_name)
            validated_data.setdefault('contact_email', request.user.email)

        concert = Concert.objects.create(**validated_data)

        for category_data in ticket_categories_data:
            category_data = dict(category_data)
            category_data.pop('id', None)
            TicketCategory.objects.create(concert=concert, **category_data)

        return concert


class ConcertListSerializer(serializers.ModelSerializer):
    cover_image = serializers.ImageField(read_only=True)
    genre_display = serializers.CharField(source='get_genre_display', read_only=True)

    class Meta:
        model = Concert
        fields = [
            'id',
            'title',
            'genre',
            'genre_display',
            'date_time',
            'venue',
            'main_artist',
            'cover_image',
            'created_at',
        ]


class ConcertDetailSerializer(BaseConcertWriteSerializer):
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'genre', 'genre_display', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email', 'contact_phone',
            'ticket_categories', 'cover_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        validated_ticket_categories = validated_data.pop('ticket_categories', None)
        ticket_categories_data = validated_ticket_categories
        raw_categories = _get_request_ticket_categories(
            self,
            invalid_message='Invalid ticket_categories payload.',
        )
        if raw_categories is not None:
            ticket_categories_data = raw_categories

        if ticket_categories_data is not None:
            ticket_categories_data = _validate_and_normalize_ticket_categories(ticket_categories_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ticket_categories_data is not None:
            existing_categories = {str(category.id): category for category in instance.ticket_categories.all()}
            kept_category_ids = set()
            for category_data in ticket_categories_data:
                payload = dict(category_data)
                raw_id = payload.pop('id', None)
                category_id = str(raw_id) if raw_id else None

                if category_id and category_id in existing_categories:
                    category = existing_categories[category_id]
                    has_sales_history = (
                        category.tickets.exists()
                        or category.payment_transactions.filter(status='Completed').exists()
                        or category.payment_transactions.filter(stock_reserved=True).exists()
                    )
                    if has_sales_history:
                        normalized_price = Decimal(payload['price'])
                        normalized_quantity = int(payload['quantity'])
                        attempted_change = (
                            category.name != payload['name']
                            or category.price != normalized_price
                            or category.quantity != normalized_quantity
                        )
                        if attempted_change:
                            raise serializers.ValidationError(
                                {
                                    'ticket_categories': (
                                        f'{category.name} ticket settings cannot be changed after bookings exist.'
                                    )
                                }
                            )
                    category.name = payload['name']
                    category.price = payload['price']
                    category.quantity = payload['quantity']
                    category.save(update_fields=['name', 'price', 'quantity'])
                    kept_category_ids.add(category_id)
                    continue

                created_category = TicketCategory.objects.create(concert=instance, **payload)
                kept_category_ids.add(str(created_category.id))

            removable_categories = instance.ticket_categories.exclude(id__in=kept_category_ids)
            for category in removable_categories:
                has_issued_tickets = category.tickets.exists() or category.payment_transactions.exists()
                if not has_issued_tickets:
                    category.delete()

        return instance

    @staticmethod
    def setup_eager_loading(queryset):
        return queryset.prefetch_related(
            Prefetch(
                'ticket_categories',
                queryset=TicketCategory.objects.annotate(sold_count=Count('tickets')),
            )
        )
