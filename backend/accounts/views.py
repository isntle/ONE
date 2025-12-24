from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer
from django.contrib.auth import authenticate, login
from .models import User

class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Auto-login after register? Or just return success
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        
        if user:
            login(request, user) # Session-based auth for now
            return Response(UserSerializer(user).data)
        return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

class StreakView(views.APIView):
    # Solo para usuarios logueados
    def get(self, request):
        # if not request.user.is_authenticated: return Response(...)
        return Response({
            "streak": request.user.streak if request.user.is_authenticated else 0,
            "energy": request.user.energy_level if request.user.is_authenticated else 100
        })
