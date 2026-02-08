import json
from rest_framework import serializers
from django.utils.datastructures import MultiValueDict
from .models import Concert, TicketCategory


class TicketCategorySerializer(serializers.ModelSerializer):
    """Serializer for ticket categories - MVP"""
    
    class Meta:
        model = TicketCategory
        fields = ['id', 'name', 'price', 'quantity']
        read_only_fields = ['id']


class ConcertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating concerts - MVP"""
    
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
        elif isinstance(data, (dict,)):
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
    
    def create(self, validated_data):
        """Create concert with ticket categories"""
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
            raise serializers.ValidationError(
                {'ticket_categories': 'This field is required.'}
            )

        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user and request.user.is_authenticated:
            organizer_name = request.user.get_full_name() or request.user.username or request.user.email
            validated_data.setdefault('organizer_name', organizer_name)
            validated_data.setdefault('contact_email', request.user.email)
        
        # Create concert
        concert = Concert.objects.create(**validated_data)
        
        # Create ticket categories
        for category_data in ticket_categories_data:
            TicketCategory.objects.create(concert=concert, **category_data)
        
        return concert


class ConcertListSerializer(serializers.ModelSerializer):
    """Serializer for listing concerts - MVP"""
    cover_image = serializers.ImageField(read_only=True)
    
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'date_time', 'venue', 'main_artist', 'cover_image'
        ]


class ConcertDetailSerializer(serializers.ModelSerializer):
    """Serializer for concert details - MVP"""
    
    ticket_categories = TicketCategorySerializer(many=True, read_only=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email', 'contact_phone',
            'ticket_categories', 'cover_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
