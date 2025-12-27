from rest_framework import viewsets
from .models import Space
from .serializers import SpaceSerializer
from rest_framework.permissions import IsAuthenticated

class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Space.objects.filter(owner=self.request.user)
