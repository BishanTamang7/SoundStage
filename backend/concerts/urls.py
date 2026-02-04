from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'concerts'

# Router for ViewSets
router = DefaultRouter()
router.register(r'concerts', views.ConcertViewSet, basename='concert')

urlpatterns = [
    # Concert endpoints (handled by ViewSet)
    path('', include(router.urls)),
]