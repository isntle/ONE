from rest_framework import serializers
from .models import Task
from spaces.models import Space

class TaskSerializer(serializers.ModelSerializer):
    # Frontend keys mapping
    titulo = serializers.CharField(source='title', required=False)
    fecha = serializers.DateField(source='date', required=False)
    horaInicio = serializers.TimeField(source='start_time', required=False, allow_null=True)
    horaFin = serializers.TimeField(source='end_time', required=False, allow_null=True)
    espacio = serializers.CharField(write_only=True, required=False) # We receive the name
    espacio_nombre = serializers.CharField(source='space.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    completada = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'titulo', 'fecha', 'horaInicio', 'horaFin', 
            'color', 'espacio', 'espacio_nombre', 'completada', 'notes', 'status',
            'owner_email'
        ]
        extra_kwargs = {
            'title': {'required': False}, 
            'date': {'required': False},
            'status': {'required': False}
        }

    def get_completada(self, obj):
        return obj.status == 'done'

    def to_internal_value(self, data):
        # Translate 'completada' boolean to 'status' string
        if 'completada' in data:
            data['status'] = 'done' if data['completada'] else 'todo'
        
        # FIX: Ensure ID is a string (frontend sends int timestamp)
        if 'id' in data:
            data['id'] = str(data['id'])

        return super().to_internal_value(data)

    def create(self, validated_data):
        user = self.context['request'].user
        espacio_name = validated_data.pop('espacio', 'Personal')
        
        # Find or create space
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
