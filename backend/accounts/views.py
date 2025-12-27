from rest_framework import status, views, viewsets, permissions
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer
from django.contrib.auth import authenticate, login
from .models import User

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny] # Simplificado para demo

    def get_queryset(self):
        # Opcional: filtrar por usuario actual si fuese prod
        return User.objects.all()

class RegisterView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(views.APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        # Intentar autenticar con email si el username falla (opcional, pero útil)
        if not username and 'email' in request.data:
            try:
                user_obj = User.objects.get(email=request.data['email'])
                username = user_obj.username
            except User.DoesNotExist:
                pass

        user = authenticate(username=username, password=password)
        
        if user:
            login(request, user)
            return Response(UserSerializer(user).data)
        return Response({"error": "Credenciales inválidas"}, status=status.HTTP_401_UNAUTHORIZED)

class UserMeView(views.APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response(UserSerializer(request.user).data)
    
    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StreakView(views.APIView):
    # Solo para usuarios logueados
    def get(self, request):
        # if not request.user.is_authenticated: return Response(...)
        return Response({
            "streak": request.user.streak if request.user.is_authenticated else 0,
            "energy": request.user.energy_level if request.user.is_authenticated else 100
        })
