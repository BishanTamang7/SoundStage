from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ConcertViewSet

app_name = 'events'

router = DefaultRouter()
router.register(r'concerts', ConcertViewSet, basename='concert')

urlpatterns = [
    path('', include(router.urls)),
]
