from rest_framework import serializers
from .models import Project
from spaces.models import Space

class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    # Mapeo de claves para el frontend (nombres en español)
    titulo = serializers.CharField(source='title', required=False)
    objetivo = serializers.DateField(source='due_date', required=False, allow_null=True)
    progreso = serializers.IntegerField(source='progress', required=False)
    descripcion = serializers.CharField(source='description', required=False, allow_blank=True, allow_null=True)
    notas = serializers.CharField(source='notes', required=False, allow_blank=True, allow_null=True)
    tareas = serializers.JSONField(source='project_tasks', required=False)
    espacio = serializers.CharField(write_only=True, required=False)
    espacio_nombre = serializers.CharField(source='space.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'titulo', 'objetivo', 'progreso', 'color', 
            'espacio', 'espacio_nombre', 'descripcion', 'etiquetas', 'notas', 'tareas', 'owner_email'
        ]

    def to_internal_value(self, data):
        # ARREGLO: Asegurar que el ID sea texto (el frontend envía números)
        if 'id' in data:
            data['id'] = str(data['id'])
        return super().to_internal_value(data)

    def create(self, validated_data):
        user = self.context['request'].user
        espacio_name = validated_data.pop('espacio', 'Personal')
        space, _ = Space.objects.get_or_create(owner=user, name=espacio_name)
        
        validated_data['space'] = space
        validated_data['owner'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'espacio' in validated_data:
            espacio_name = validated_data.pop('espacio')
            user = self.context['request'].user
            space, _ = Space.objects.get_or_create(owner=user, name=espacio_name)
            instance.space = space
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['espacio'] = instance.space.name if instance.space else 'Personal'
        return ret
