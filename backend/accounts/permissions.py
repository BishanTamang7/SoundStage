from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrganizer(BasePermission):
    """
    Permission class to check if user is an Organizer.
    Only Organizers can access the view.
    """
    message = "Only organizers can perform this action."
    
    def has_permission(self, request, view):
        # Check if user is authenticated and is an organizer
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role == 'ORGANIZER'
        )


class IsAttendee(BasePermission):
    """
    Permission class to check if user is an Attendee.
    Only Attendees can access the view.
    """
    message = "Only attendees can perform this action."
    
    def has_permission(self, request, view):
        # Check if user is authenticated and is an attendee
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role == 'ATTENDEE'
        )


class IsOwnerOrReadOnly(BasePermission):
    """
    Permission class to check if user is the owner of the object.
    - Read permissions: Anyone (GET, HEAD, OPTIONS)
    - Write permissions: Only owner (POST, PUT, PATCH, DELETE)
    """
    message = "You must be the owner to perform this action."
    
    def has_object_permission(self, request, view, obj):
        # Read permissions allowed for any request (SAFE_METHODS)
        if request.method in SAFE_METHODS:
            return True
        
        # Write permissions only for owner
        # Handle different object structures
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        # If object is the user itself
        return obj == request.user


class IsOrganizerOrReadOnly(BasePermission):
    """
    Permission class for Organizer write access.
    - Read permissions: Anyone (GET, HEAD, OPTIONS)
    - Write permissions: Only Organizers (POST, PUT, PATCH, DELETE)
    """
    message = "Only organizers can modify this resource."
    
    def has_permission(self, request, view):
        # Read permissions for any request (SAFE_METHODS)
        if request.method in SAFE_METHODS:
            return True
        
        # Write permissions only for authenticated Organizers
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role == 'ORGANIZER'
        )
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for safe methods
        if request.method in SAFE_METHODS:
            return True
        
        # Write permissions only for organizers
        return (
            request.user 
            and request.user.is_authenticated 
            and request.user.role == 'ORGANIZER'
        )


class IsOrganizerOrOwner(BasePermission):
    """
    Permission class for Organizer or Owner access.
    - Organizers: Full access
    - Owners: Can only modify their own objects
    - Others: Read-only access
    """
    message = "You must be an organizer or the owner to perform this action."
    
    def has_permission(self, request, view):
        # Everyone can read
        if request.method in SAFE_METHODS:
            return True
        
        # Must be authenticated for write operations
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Read permissions for safe methods
        if request.method in SAFE_METHODS:
            return True
        
        # Organizers have full access
        if request.user.role == 'ORGANIZER':
            return True
        
        # Owners can modify their own objects
        if hasattr(obj, 'user'):
            return obj.user == request.user
        elif hasattr(obj, 'owner'):
            return obj.owner == request.user
        
        return obj == request.user


class IsAuthenticatedOrReadOnly(BasePermission):
    """
    Permission class for authenticated write access.
    - Read permissions: Anyone
    - Write permissions: Authenticated users only
    """
    message = "You must be authenticated to perform this action."
    
    def has_permission(self, request, view):
        # Read permissions for any request
        if request.method in SAFE_METHODS:
            return True
        
        # Write permissions only for authenticated users
        return request.user and request.user.is_authenticated