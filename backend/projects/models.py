from django.db import models
from django.conf import settings
import uuid

class Project(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='projects')
    space = models.ForeignKey('spaces.Space', on_delete=models.CASCADE, related_name='projects')
    
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    color = models.CharField(max_length=20, default="#8B5CF6") # Purple
    due_date = models.DateField(null=True, blank=True)
    progress = models.IntegerField(default=0)
    etiquetas = models.CharField(max_length=200, blank=True) # Tags separated by commas
    is_active = models.BooleanField(default=True)
    
    # Sync fields
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title}"
