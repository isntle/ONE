from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    nombre = models.CharField(max_length=150, blank=True, default='')
    streak = models.IntegerField(default=0)
    last_login_streak = models.DateField(null=True, blank=True)
    energy_level = models.IntegerField(default=100) # AI usage/Energy tracking
    preferences = models.JSONField(default=dict, blank=True) # For theme, habits, etc.
    
    def __str__(self):
        return self.username
