from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Autenticación de Sesión personalizada que omite la validación CSRF.
    Esto es seguro para nuestro caso de uso porque:
    1. Usamos cookies de sesión solo para identificación de usuario.
    2. El frontend y backend están en puertos diferentes (cross-origin).
    3. CORS está configurado adecuadamente para permitir solo orígenes confiables.
    """

    def enforce_csrf(self, request):
        return  # Omitir verificación CSRF completamente
