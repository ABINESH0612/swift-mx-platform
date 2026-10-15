package swift_mx.security;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import swift_mx.exception.UnauthorizedException;
import swift_mx.service.AuthService;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Allow CORS pre-flight requests to pass through
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        String token = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else {
            // Also check alternate header X-Auth-Token
            token = request.getHeader("X-Auth-Token");
        }

        if (token == null || !authService.validateToken(token)) {
            throw new UnauthorizedException("Unauthorized: Missing or invalid authentication token. Please log in.");
        }

        return true;
    }
}
