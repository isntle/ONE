from rest_framework import serializers
from .models import Habit, HabitLog

class HabitLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitLog
        fields = ['date', 'done', 'note']

class HabitSerializer(serializers.ModelSerializer):
    # Flatten logs for frontend: { '2023-01-01': { completado: true, nota: '' } }
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
        # FIX: Ensure ID is a string
        if 'id' in data:
            data['id'] = str(data['id'])

        # FIX: Map 'registros' (frontend) to 'registros_input' (backend write)
        if 'registros' in data and 'registros_input' not in data:
            data['registros_input'] = data['registros']
        
        return super().to_internal_value(data)

    def create(self, validated_data):
        user = self.context['request'].user
        registros_data = validated_data.pop('registros_input', {})
        
        habit = Habit.objects.create(owner=user, **validated_data)
        
        # Handle logs creation
        self._update_logs(habit, registros_data)
        return habit

    def update(self, instance, validated_data):
        registros_data = validated_data.pop('registros_input', {})
        instance = super().update(instance, validated_data)
        self._update_logs(instance, registros_data)
        return instance

    def _update_logs(self, habit, registros_data):
        if not registros_data:
            return
            
        for date_iso, data in registros_data.items():
            done = data.get('completado', True)
            note = data.get('nota', '')
            
            HabitLog.objects.update_or_create(
                habit=habit,
                date=date_iso,
                defaults={'done': done, 'note': note}
            )
