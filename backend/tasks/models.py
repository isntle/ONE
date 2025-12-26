from django.db import models
from django.conf import settings
import uuid

class Task(models.Model):
    id = models.CharField(max_length=50, primary_key=True, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tasks')
    space = models.ForeignKey('spaces.Space', on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    
    title = models.CharField(max_length=200)
    notes = models.TextField(blank=True)
    
    # Timing
    date = models.DateField() # YYYY-MM-DD
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    duration_min = models.IntegerField(default=60)
    
    # Metadata
    location = models.CharField(max_length=100, blank=True)
    tag = models.CharField(max_length=50, blank=True) # escuela, estudio, etc.
    color = models.CharField(max_length=20, default="verde") 
    
    # Status
    status = models.CharField(max_length=20, default="todo") # todo, done
    
    # Sync fields
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} ({self.date})"
