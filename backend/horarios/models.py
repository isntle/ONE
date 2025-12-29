from django.db import models
from django.conf import settings
import uuid


class Clase(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='clases')
    space = models.ForeignKey('spaces.Space', on_delete=models.CASCADE, related_name='clases')

    materia = models.CharField(max_length=150)
    profesor = models.CharField(max_length=150, blank=True)
    salon = models.CharField(max_length=120, blank=True)
    dia_semana = models.IntegerField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    color = models.CharField(max_length=20, default="#429155")

    # Campos de sincronización
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.materia} ({self.dia_semana} {self.hora_inicio}-{self.hora_fin})"
