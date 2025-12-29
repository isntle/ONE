from rest_framework import viewsets, permissions
from .models import Gasto, Presupuesto
from .serializers import GastoSerializer, PresupuestoSerializer


class GastoViewSet(viewsets.ModelViewSet):
    serializer_class = GastoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Gasto.objects.filter(owner=self.request.user)


class PresupuestoViewSet(viewsets.ModelViewSet):
    serializer_class = PresupuestoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Presupuesto.objects.filter(owner=self.request.user)
