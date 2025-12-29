"""
Configuración de URLs para el proyecto one_backend.
Aquí definimos las rutas de la API para conectar las vistas con las URLs.
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from spaces.views import SpaceViewSet
from projects.views import ProjectViewSet
from tasks.views import TaskViewSet
from habits.views import HabitViewSet, HabitLogViewSet
from finanzas.views import GastoViewSet, PresupuestoViewSet
from horarios.views import ClaseViewSet

from accounts.views import RegisterView, LoginView, StreakView, UserViewSet, UserMeView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'spaces', SpaceViewSet, basename='space')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'habit-logs', HabitLogViewSet, basename='habit-log')
router.register(r'gastos', GastoViewSet, basename='gasto')
router.register(r'presupuestos', PresupuestoViewSet, basename='presupuesto')
router.register(r'clases', ClaseViewSet, basename='clase')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/me/', UserMeView.as_view(), name='user-me'),
    path('api/streak/', StreakView.as_view(), name='streak'),
]
