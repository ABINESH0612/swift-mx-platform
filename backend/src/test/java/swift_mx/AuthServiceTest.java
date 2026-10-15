package swift_mx;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import swift_mx.dto.LoginRequest;
import swift_mx.dto.LoginResponse;
import swift_mx.exception.UnauthorizedException;
import swift_mx.service.AuthService;

class AuthServiceTest {

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService();
        ReflectionTestUtils.setField(authService, "configuredUsername", "admin");
        ReflectionTestUtils.setField(authService, "configuredPassword", "admin123");
    }

    @Test
    void testSuccessfulAuthentication() {
        LoginResponse response = authService.authenticate(new LoginRequest("admin", "admin123"));
        assertNotNull(response);
        assertNotNull(response.getToken());
        assertEquals("admin", response.getUsername());
        assertTrue(authService.validateToken(response.getToken()));
    }

    @Test
    void testAuthenticationFailsWithInvalidPassword() {
        assertThrows(UnauthorizedException.class, () ->
            authService.authenticate(new LoginRequest("admin", "wrongpass"))
        );
    }

    @Test
    void testAuthenticationFailsWithInvalidUsername() {
        assertThrows(UnauthorizedException.class, () ->
            authService.authenticate(new LoginRequest("nonexistent", "admin123"))
        );
    }

    @Test
    void testLogoutInvalidatesToken() {
        LoginResponse response = authService.authenticate(new LoginRequest("admin", "admin123"));
        String token = response.getToken();
        assertTrue(authService.validateToken(token));

        authService.logout(token);
        assertFalse(authService.validateToken(token));
    }

    @Test
    void testPasswordIsNotTrimmedDuringAuthentication() {
        assertThrows(UnauthorizedException.class, () ->
            authService.authenticate(new LoginRequest("admin", "admin123 "))
        );
    }
}
