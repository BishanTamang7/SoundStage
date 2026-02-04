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
    
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email',
            'ticket_categories'
        ]
        read_only_fields = ['id']
    
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
    
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'date_time', 'venue', 'main_artist'
        ]


class ConcertDetailSerializer(serializers.ModelSerializer):
    """Serializer for concert details - MVP"""
    
    ticket_categories = TicketCategorySerializer(many=True, read_only=True)
    
    class Meta:
        model = Concert
        fields = [
            'id', 'title', 'description', 'date_time', 'venue',
            'main_artist', 'organizer_name', 'contact_email',
            'ticket_categories', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']