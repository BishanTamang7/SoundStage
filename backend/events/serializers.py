import json
from decimal import Decimal

from django.db.models import Count, Prefetch
from django.utils.datastructures import MultiValueDict
from rest_framework import serializers

from events.constants import ALLOWED_CONCERT_CITIES
from events.models import Concert
from tickets.models import TicketCategory


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
        sold = self._get_sold_count(obj)
        return Decimal(obj.price) * sold


class ConcertCreateSerializer(serializers.ModelSerializer):
    ticket_categories = TicketCategorySerializer(many=True, required=False)
    cover_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email', 'contact_phone',
            'ticket_categories', 'cover_image'
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'organizer_name': {'required': False},
            'contact_email': {'required': False},
        }

    def to_internal_value(self, data):
        if isinstance(data, MultiValueDict) or hasattr(data, 'getlist'):
            mutable_data = data.copy()
        elif isinstance(data, dict):
            mutable_data = dict(data)
        else:
            mutable_data = data.copy() if hasattr(data, 'copy') else data

        if hasattr(mutable_data, 'get'):
            raw_categories = mutable_data.get('ticket_categories')
            if isinstance(raw_categories, str):
                try:
                    mutable_data['ticket_categories'] = json.loads(raw_categories)
                except json.JSONDecodeError:
                    pass

            for key in ['organizer_name', 'contact_email']:
                value = mutable_data.get(key)
                if value is None or (isinstance(value, str) and not value.strip()):
                    if hasattr(mutable_data, 'pop'):
                        mutable_data.pop(key, None)

        return super().to_internal_value(mutable_data)

    def validate_venue(self, value):
        venue = (value or '').strip()
        normalized_venue = venue.lower()
        if any(city in normalized_venue for city in ALLOWED_CONCERT_CITIES):
            return venue
        allowed_cities = ', '.join(city.title() for city in ALLOWED_CONCERT_CITIES)
        raise serializers.ValidationError(
            f'Venue must include one of the allowed cities: {allowed_cities}.'
        )

    def create(self, validated_data):
        ticket_categories_data = validated_data.pop('ticket_categories', None)
        if ticket_categories_data is None:
            raw_categories = None
            if hasattr(self, 'initial_data'):
                raw_categories = self.initial_data.get('ticket_categories')
            if raw_categories is None:
                request = self.context.get('request')
                if request is not None:
                    raw_categories = request.data.get('ticket_categories')

            if isinstance(raw_categories, str):
                try:
                    ticket_categories_data = json.loads(raw_categories)
                except json.JSONDecodeError:
                    ticket_categories_data = None
            elif raw_categories is not None:
                ticket_categories_data = raw_categories

        if not ticket_categories_data:
            raise serializers.ValidationError({'ticket_categories': 'This field is required.'})

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

    class Meta:
        model = Concert
        fields = ['id', 'title', 'date_time', 'venue', 'main_artist', 'cover_image']


class ConcertDetailSerializer(serializers.ModelSerializer):
    ticket_categories = TicketCategorySerializer(many=True, required=False)
    cover_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email', 'contact_phone',
            'ticket_categories', 'cover_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        if isinstance(data, MultiValueDict) or hasattr(data, 'getlist'):
            mutable_data = data.copy()
        elif isinstance(data, dict):
            mutable_data = dict(data)
        else:
            mutable_data = data.copy() if hasattr(data, 'copy') else data

        if hasattr(mutable_data, 'get'):
            raw_categories = mutable_data.get('ticket_categories')
            if isinstance(raw_categories, str):
                try:
                    mutable_data['ticket_categories'] = json.loads(raw_categories)
                except json.JSONDecodeError:
                    pass

        return super().to_internal_value(mutable_data)

    def validate_venue(self, value):
        venue = (value or '').strip()
        normalized_venue = venue.lower()
        if any(city in normalized_venue for city in ALLOWED_CONCERT_CITIES):
            return venue
        allowed_cities = ', '.join(city.title() for city in ALLOWED_CONCERT_CITIES)
        raise serializers.ValidationError(
            f'Venue must include one of the allowed cities: {allowed_cities}.'
        )

    def update(self, instance, validated_data):
        validated_ticket_categories = validated_data.pop('ticket_categories', None)
        raw_categories = None
        if hasattr(self, 'initial_data'):
            raw_categories = self.initial_data.get('ticket_categories')
        if raw_categories is None:
            request = self.context.get('request')
            if request is not None:
                raw_categories = request.data.get('ticket_categories')

        ticket_categories_data = validated_ticket_categories
        if isinstance(raw_categories, str):
            try:
                ticket_categories_data = json.loads(raw_categories)
            except json.JSONDecodeError:
                raise serializers.ValidationError({'ticket_categories': 'Invalid ticket_categories payload.'})
        elif raw_categories is not None:
            ticket_categories_data = raw_categories

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ticket_categories_data is not None:
            if len(ticket_categories_data) == 0:
                raise serializers.ValidationError({'ticket_categories': 'At least one ticket category is required.'})

            existing_categories = {str(category.id): category for category in instance.ticket_categories.all()}
            kept_category_ids = set()
            for category_data in ticket_categories_data:
                payload = dict(category_data)
                raw_id = payload.pop('id', None)
                category_id = str(raw_id) if raw_id else None

                if category_id and category_id in existing_categories:
                    category = existing_categories[category_id]
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
