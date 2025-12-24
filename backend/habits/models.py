from django.db import models
from django.conf import settings
import uuid

class Habit(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='habits')
    space = models.ForeignKey('spaces.Space', on_delete=models.CASCADE, related_name='habits', null=True)
    
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=20, default="#FFFFFF")
    goal_per_week = models.IntegerField(default=7)
    
    # Sync fields
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class HabitLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE, related_name='logs')
    date = models.DateField()
    done = models.BooleanField(default=True)
    note = models.CharField(max_length=255, blank=True) # Contexto
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('habit', 'date')
