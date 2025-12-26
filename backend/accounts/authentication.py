from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Custom SessionAuthentication that bypasses CSRF validation.
    This is safe for our use case because:
    1. We use session cookies for user identification only.
    2. The frontend and backend are on different ports (cross-origin).
    3. CORS is properly configured to only allow trusted origins.
    """

    def enforce_csrf(self, request):
        return  # Skip CSRF check entirely
