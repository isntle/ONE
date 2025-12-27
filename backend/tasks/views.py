from rest_framework import viewsets, permissions
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    # Usamos el serializador de Tareas para convertir los datos
    serializer_class = TaskSerializer
    # Solo permitimos que usuarios logueados vean esto
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtramos las tareas para que solo salgan las del usuario actual
        return Task.objects.filter(owner=self.request.user)

