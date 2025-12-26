from rest_framework import serializers
from .models import Project
from spaces.models import Space

class ProjectSerializer(serializers.ModelSerializer):
    # Frontend keys mapping
    titulo = serializers.CharField(source='title', required=False)
    objetivo = serializers.DateField(source='due_date', required=False, allow_null=True)
    progreso = serializers.IntegerField(source='progress', required=False)
    espacio = serializers.CharField(write_only=True, required=False)
    espacio_nombre = serializers.CharField(source='space.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    
    class Meta:
        model = Project
        fields = [
            'id', 'titulo', 'objetivo', 'progreso', 'color', 
            'espacio', 'espacio_nombre', 'description', 'etiquetas', 'owner_email'
        ]

    def to_internal_value(self, data):
        # FIX: Ensure ID is a string (frontend sends int timestamp)
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
