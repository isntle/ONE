from rest_framework import viewsets, permissions
from .models import Project
from .serializers import ProjectSerializer

class ProjectViewSet(viewsets.ModelViewSet):
    # Usamos el serializador de Proyectos para convertir los datos
    serializer_class = ProjectSerializer
    # Solo permitimos que usuarios logueados vean esto
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtramos los proyectos para que solo salgan los del usuario actual
        return Project.objects.filter(owner=self.request.user)

