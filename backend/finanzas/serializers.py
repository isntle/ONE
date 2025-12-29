from rest_framework import serializers
from .models import Gasto, Presupuesto
from spaces.models import Space


class GastoSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    espacio = serializers.CharField(write_only=True, required=False)
    espacio_nombre = serializers.CharField(source='space.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Gasto
        fields = [
            'id',
            'descripcion',
            'categoria',
            'fecha',
            'monto',
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
        espacio_nombre = validated_data.pop('espacio', 'Personal')
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
        ret['espacio'] = instance.space.name if instance.space else 'Personal'
        return ret


class PresupuestoSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    espacio = serializers.CharField(write_only=True, required=False)
    espacio_nombre = serializers.CharField(source='space.name', read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Presupuesto
        fields = [
            'id',
            'mes',
            'anio',
            'monto',
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
        espacio_nombre = validated_data.pop('espacio', 'Personal')
        espacio, _ = Space.objects.get_or_create(owner=user, name=espacio_nombre)

        mes = validated_data.get('mes')
        anio = validated_data.get('anio')
        monto = validated_data.get('monto')

        existente = Presupuesto.objects.filter(owner=user, space=espacio, mes=mes, anio=anio).first()
        if existente:
            existente.monto = monto
            existente.save()
            return existente

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
        ret['espacio'] = instance.space.name if instance.space else 'Personal'
        return ret
