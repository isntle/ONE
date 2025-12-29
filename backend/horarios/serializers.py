from rest_framework import serializers
from .models import Clase
from spaces.models import Space


class ClaseSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    diaSemana = serializers.IntegerField(source='dia_semana', required=False)
    horaInicio = serializers.TimeField(
        source='hora_inicio',
        required=False,
        allow_null=True,
        format='%H:%M',
        input_formats=['%H:%M', '%H:%M:%S']
    )
    horaFin = serializers.TimeField(
        source='hora_fin',
        required=False,
        allow_null=True,
        format='%H:%M',
        input_formats=['%H:%M', '%H:%M:%S']
    )
    espacio = serializers.CharField(write_only=True, required=False)
    espacio_nombre = serializers.CharField(source='space.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Clase
        fields = [
            'id',
            'materia',
            'profesor',
            'salon',
            'diaSemana',
            'horaInicio',
            'horaFin',
            'color',
            'espacio',
            'espacio_nombre',
            'owner_email'
        ]

    def to_internal_value(self, data):
        if 'id' in data:
            data['id'] = str(data['id'])
        return super().to_internal_value(data)

    def create(self, validated_data):
        user = self.context['request'].user
        espacio_nombre = validated_data.pop('espacio', 'Escuela')
        espacio, _ = Space.objects.get_or_create(owner=user, name=espacio_nombre)

        validated_data['space'] = espacio
        validated_data['owner'] = user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'espacio' in validated_data:
            espacio_nombre = validated_data.pop('espacio')
            user = self.context['request'].user
            espacio, _ = Space.objects.get_or_create(owner=user, name=espacio_nombre)
            instance.space = espacio
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['espacio'] = instance.space.name if instance.space else 'Escuela'
        return ret
