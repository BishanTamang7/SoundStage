from rest_framework import serializers
from .models import Concert



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
