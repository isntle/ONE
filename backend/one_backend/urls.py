"""
URL configuration for one_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from spaces.views import SpaceViewSet
from projects.views import ProjectViewSet
from tasks.views import TaskViewSet
from habits.views import HabitViewSet, HabitLogViewSet

from accounts.views import RegisterView, LoginView, StreakView, UserViewSet, UserMeView

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'spaces', SpaceViewSet, basename='space')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'habit-logs', HabitLogViewSet, basename='habit-log')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/me/', UserMeView.as_view(), name='user-me'),
    path('api/streak/', StreakView.as_view(), name='streak'),
]
