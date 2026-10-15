package swift_mx.service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import swift_mx.dto.LoginRequest;
import swift_mx.dto.LoginResponse;
import swift_mx.exception.UnauthorizedException;

@Service
public class AuthService {

    @Value("${app.security.username}")
    private String configuredUsername;

    @Value("${app.security.password}")
    private String configuredPassword;

    // In-memory token storage: token -> username
    private final Map<String, String> activeTokens = new ConcurrentHashMap<>();

    public LoginResponse authenticate(LoginRequest request) {
        if (request == null || request.getUsername() == null || request.getPassword() == null) {
            throw new UnauthorizedException("Username and password must not be null");
        }

        if (configuredUsername.equals(request.getUsername().trim()) &&
            configuredPassword.equals(request.getPassword())) {
            
            String token = UUID.randomUUID().toString().replace("-", "");
            activeTokens.put(token, request.getUsername().trim());
            return new LoginResponse(token, request.getUsername().trim(), "Authentication successful");
        }

        throw new UnauthorizedException("Invalid username or password");
    }

    public boolean validateToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return activeTokens.containsKey(token.trim());
    }

    public void logout(String token) {
        if (token != null) {
            activeTokens.remove(token.trim());
        }
    }

    public String getUsernameFromToken(String token) {
        return activeTokens.get(token);
    }
}
