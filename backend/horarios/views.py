from rest_framework import viewsets, permissions
from .models import Clase
from .serializers import ClaseSerializer


class ClaseViewSet(viewsets.ModelViewSet):
    serializer_class = ClaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Clase.objects.filter(owner=self.request.user)
