from rest_framework import serializers
from .models import Habit, HabitLog

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['date', 'done', 'note']

class HabitSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    # Aplanar registros para el frontend: { '2023-01-01': { completado: true, nota: '' } }
    registros = serializers.SerializerMethodField()
    registros_input = serializers.DictField(write_only=True, required=False)
    nombre = serializers.CharField(source='name', required=False)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)

    class Meta:
        model = Habit
        fields = ['id', 'nombre', 'registros', 'registros_input', 'owner_email']

    def get_registros(self, obj):
        logs = obj.logs.all()
        result = {}
        for log in logs:
            result[log.date.isoformat()] = {
                'completado': log.done,
                'nota': log.note
            }
        return result

    def to_internal_value(self, data):
        # ARREGLO: Asegurar que el ID sea texto
        if 'id' in data:
            data['id'] = str(data['id'])

        # ARREGLO: Mapear 'registros' (frontend) a 'registros_input' (backend)
        if 'registros' in data and 'registros_input' not in data:
            data['registros_input'] = data['registros']
        
        return super().to_internal_value(data)

    def create(self, validated_data):
        user = self.context['request'].user
        registros_data = validated_data.pop('registros_input', None)
        
        habit = Habit.objects.create(owner=user, **validated_data)
        
        # Manejar la creación de registros
        self._update_logs(habit, registros_data)
        return habit

    def update(self, instance, validated_data):
        registros_data = validated_data.pop('registros_input', None)
        instance = super().update(instance, validated_data)
        self._update_logs(instance, registros_data)
        return instance

    def _update_logs(self, habit, registros_data):
        if registros_data is None:
            return

        existing_logs = {log.date.isoformat(): log for log in habit.logs.all()}
        incoming_dates = set(registros_data.keys())

        for date_iso, data in registros_data.items():
            done = data.get('completado', True)
            note = data.get('nota', '')
            
            HabitLog.objects.update_or_create(
                habit=habit,
                date=date_iso,
                defaults={'done': done, 'note': note}
            )

        for date_iso, log in existing_logs.items():
            if date_iso not in incoming_dates:
                log.delete()
