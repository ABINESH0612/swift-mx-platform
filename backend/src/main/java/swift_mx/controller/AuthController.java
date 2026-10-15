package swift_mx.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import swift_mx.dto.LoginRequest;
import swift_mx.dto.LoginResponse;
import swift_mx.service.AuthService;

@RestController
@RequestMapping("/api/auth")
@Validated
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.authenticate(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Auth-Token", required = false) String headerToken) {
        
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else if (headerToken != null) {
            token = headerToken.trim();
        }

        if (token != null) {
            authService.logout(token);
        }

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> check(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-Auth-Token", required = false) String headerToken) {
        
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7).trim();
        } else if (headerToken != null) {
            token = headerToken.trim();
        }

        boolean isValid = authService.validateToken(token);
        String username = isValid ? authService.getUsernameFromToken(token) : null;

        return ResponseEntity.ok(Map.of(
            "authenticated", isValid,
            "username", username != null ? username : ""
        ));
    }
}
