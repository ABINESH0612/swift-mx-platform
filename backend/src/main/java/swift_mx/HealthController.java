package swift_mx;

import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import javax.sql.DataSource;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> health() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection.isValid(2)) {
                return ResponseEntity.ok(Map.of(
                    "status", "UP",
                    "application", "SWIFT MX Message Processing",
                    "database", "Connected"
                ));
            }
        } catch (SQLException ex) {
            // Do not expose connection details or credentials to API callers.
        }

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
            "status", "DOWN",
            "application", "SWIFT MX Message Processing",
            "database", "Unavailable"
        ));
    }
}
