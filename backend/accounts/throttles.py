from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """
    Throttle login attempts to mitigate brute-force attacks.

    Uses a per-identifier cache key combining email (when supplied) and client IP.
    Default rate: 5 attempts per minute.
    """

    scope = 'login'
    rate = '5/min'

    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        email = (request.data.get('email') or '').strip().lower() if hasattr(request, "data") else ''
        key_ident = f'{email}:{ident}' if email else ident
        return self.cache_format % {'scope': self.scope, 'ident': key_ident}
