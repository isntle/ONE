from django.db import models
from django.conf import settings
import uuid

class Space(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='spaces')
    name = models.CharField(max_length=50) # Personal, Escuela, Trabajo
    color = models.CharField(max_length=20, default="#FFFFFF")
    
    # Sync fields
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} ({self.owner})"
