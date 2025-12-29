from django.db import models
from django.conf import settings
import uuid


class Gasto(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gastos')
    space = models.ForeignKey('spaces.Space', on_delete=models.CASCADE, related_name='gastos')

    descripcion = models.CharField(max_length=200)
    categoria = models.CharField(max_length=60, blank=True)
    fecha = models.DateField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    # Campos de sincronización
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.descripcion} - ${self.monto}"


class Presupuesto(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='presupuestos')
    space = models.ForeignKey('spaces.Space', on_delete=models.CASCADE, related_name='presupuestos')

    mes = models.IntegerField()
    anio = models.IntegerField()
    monto = models.DecimalField(max_digits=10, decimal_places=2)

    # Campos de sincronización
    version = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted = models.BooleanField(default=False)

    class Meta:
        unique_together = ('owner', 'space', 'mes', 'anio')

    def __str__(self):
        return f"{self.mes}/{self.anio} - ${self.monto}"
