from rest_framework import viewsets, permissions
from .models import Habit, HabitLog
from .serializers import HabitSerializer, HabitLogSerializer

class HabitViewSet(viewsets.ModelViewSet):
    serializer_class = HabitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(owner=self.request.user)

class HabitLogViewSet(viewsets.ModelViewSet):
    serializer_class = HabitLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Devolver registros de hábitos del usuario actual
        return HabitLog.objects.filter(habit__owner=self.request.user)
