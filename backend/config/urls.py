"""
URL configuration for config project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # Admin site
    path('admin/', admin.site.urls),
    
    # Accounts API
    path('api/accounts/', include('accounts.urls')),
]

# Serve media and static files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom admin branding
admin.site.site_header = "SoundStage Admin"
admin.site.site_title = "SoundStage Admin Portal"
admin.site.index_title = "Welcome to SoundStage Event Management"