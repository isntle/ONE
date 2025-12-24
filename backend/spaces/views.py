from rest_framework import viewsets
from .models import Space
from .serializers import SpaceSerializer
from rest_framework.permissions import IsAuthenticated

class SpaceViewSet(viewsets.ModelViewSet):
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    # permission_classes = [IsAuthenticated] # Descomentar cuando Auth esté listo en frontend
    
    def get_queryset(self):
        # Filtrar por usuario logueado (si hay auth)
        # return self.queryset.filter(owner=self.request.user)
        return self.queryset
