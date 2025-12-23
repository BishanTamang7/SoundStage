from rest_framework.permissions import BasePermission


class IsOrganizer(BasePermission):
    """
    Permission class to check if user is an Organizer.
    Only Organizers can access the view.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user role is ORGANIZER
        return request.user.role == 'ORGANIZER'


class IsAttendee(BasePermission):
    """
    Permission class to check if user is an Attendee.
    Only Attendees can access the view.
    """
    
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user role is ATTENDEE
        return request.user.role == 'ATTENDEE'


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission class to check if user is the owner of the object.
    - Read permissions: Anyone (GET, HEAD, OPTIONS)
    - Write permissions: Only owner (POST, PUT, PATCH, DELETE)
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions allowed for any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions only for owner
        return obj.user == request.user


class IsOrganizerOrReadOnly(BasePermission):
    """
    Permission class for Organizer write access.
    - Read permissions: Anyone (GET, HEAD, OPTIONS)
    - Write permissions: Only Organizers (POST, PUT, PATCH, DELETE)
    """
    
    def has_permission(self, request, view):
        # Read permissions for any request
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        # Write permissions only for authenticated Organizers
        if not request.user or not request.user.is_authenticated:
            return False
        
        return request.user.role == 'ORGANIZER'