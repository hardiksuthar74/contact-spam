from .auth import urlpatterns as auth_patterns
from .contact import urlpatterns as contact_patterns


urlpatterns = [
    *auth_patterns,
    *contact_patterns,
]
