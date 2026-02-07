import json
from rest_framework import serializers
from .models import Concert, TicketCategory


class TicketCategorySerializer(serializers.ModelSerializer):
    """Serializer for ticket categories - MVP"""
    
    class Meta:
        model = TicketCategory
        fields = ['id', 'name', 'price', 'quantity']
        read_only_fields = ['id']


class ConcertCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating concerts - MVP"""
    
    ticket_categories = TicketCategorySerializer(many=True)
    cover_image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email', 'contact_phone',
            'ticket_categories', 'cover_image'
        ]
        read_only_fields = ['id']

    def to_internal_value(self, data):
        if isinstance(data, (dict,)):
            mutable_data = dict(data)
        else:
            mutable_data = data.copy() if hasattr(data, 'copy') else data

        if isinstance(mutable_data, dict):
            raw_categories = mutable_data.get('ticket_categories')
            if isinstance(raw_categories, str):
                try:
                    mutable_data['ticket_categories'] = json.loads(raw_categories)
                except json.JSONDecodeError:
                    pass

        return super().to_internal_value(mutable_data)
    
    def create(self, validated_data):
        """Create concert with ticket categories"""
        ticket_categories_data = validated_data.pop('ticket_categories')
        
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
