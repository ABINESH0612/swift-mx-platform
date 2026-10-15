# SWIFT MX (ISO 20022) Message Processing & Inquiry Platform

A high-performance Full-Stack Web Application for processing, validating, storing, and auditing **SWIFT MX (ISO 20022)** financial messages (specifically focusing on **`pacs.008` — Financial Institutional Customer Credit Transfer**).

Built using **Java (compiler target 21)**, **Spring Boot 4**, **Spring Data JPA**, **MySQL 8.0**, and **React.js (Vite)**.

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────┐
│              React.js Frontend (Port 5173)             │
│  - Modern Fintech Dark-Mode UI                         │
│  - XML File Upload & Interactive Editor                │
│  - Extracted ISO 20022 Element Display                 │
│  - Live Search & Inquiry Audit Table                   │
│  - Original XML Modal Inspector & Copy-to-Clipboard    │
└───────────────────────────┬────────────────────────────┘
                            │ REST APIs / JSON / Multipart
                            ▼
┌────────────────────────────────────────────────────────┐
│            Spring Boot Backend (Port 8080)             │
│  - AuthInterceptor (Bearer Token Security)             │
│  - SwiftXmlParserService (Secure XXE-Safe DOM Parser)  │
│  - SwiftMessageService (Transaction Management)        │
│  - SwiftMessageRepository (Spring Data JPA)            │
│  - GlobalExceptionHandler (Standardized Error Schema)  │
└───────────────────────────┬────────────────────────────┘
                            │ JDBC Connection (Port 3306)
                            ▼
┌────────────────────────────────────────────────────────┐
│                  MySQL Database (8.0+)                 │
│  - swift_mx_db.swift_messages                          │
│  - Longtext XML storage, Decimal(20,5) Financial Amts  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
D:\swift-mx\
├── README.md                           # Comprehensive documentation & Job prep guide
├── schema.sql                          # MySQL table creation and indexing script
├── SWIFT MX message type.pdf           # Project functional specifications
│
├── samples\                            # Sample test files
│   ├── sample-pacs008-valid.xml        # Standard ISO 20022 pacs.008 message
│   ├── sample-pacs008-envelope.xml     # pacs.008 with AppHdr (Business Application Header)
│   ├── sample-malformed.xml            # Invalid XML syntax test file
│   └── sample-non-mx.xml               # Non-SWIFT XML test file
│
├── swift-mx\                           # Spring Boot Backend Project
│   ├── pom.xml                         # Maven dependencies & build configuration
│   ├── mvnw.cmd / mvnw                 # Maven wrapper scripts
│   └── src\
│       ├── main\java\swift_mx\
│       │   ├── SwiftMxApplication.java # Spring Boot Main Application entry
│       │   ├── SwiftMessage.java       # JPA Entity matching swift_messages table
│       │   ├── HealthController.java   # /api/health endpoint
│       │   ├── config\WebConfig.java   # CORS & AuthInterceptor configuration
│       │   ├── controller\
│       │   │   ├── AuthController.java # Login, logout, session check
│       │   │   └── SwiftMessageController.java # Message submission, search, inquiry
│       │   ├── dto\
│       │   │   ├── LoginRequest.java
│       │   │   ├── LoginResponse.java
│       │   │   ├── MessageProcessRequest.java
│       │   │   └── SwiftMessageDto.java
│       │   ├── exception\
│       │   │   ├── GlobalExceptionHandler.java
│       │   │   ├── XmlParseException.java
│       │   │   ├── InvalidMessageException.java
│       │   │   └── UnauthorizedException.java
│       │   ├── repository\
│       │   │   └── SwiftMessageRepository.java # JPA repository with search queries
│       │   ├── security\
│       │   │   └── AuthInterceptor.java # Bearer token verification interceptor
│       │   └── service\
│       │       ├── AuthService.java    # Session token management & verification
│       │       ├── SwiftXmlParserService.java # XXE-safe ISO 20022 DOM parser
│       │       └── SwiftMessageService.java  # Message persistence & retrieval
│       └── main\resources\
│           └── application.properties  # Datasource & security properties
│
└── frontend\                           # React.js Frontend Project (Vite)
    ├── package.json                    # Frontend dependencies (React 19, Lucide icons)
    ├── vite.config.js                  # Proxy configuration to Spring Boot (:8080)
    ├── index.html                      # HTML5 entry with Inter & JetBrains Mono fonts
    └── src\
        ├── index.css                   # Global fintech CSS theme tokens
        ├── App.jsx                     # Root application state & navigation
        ├── services\api.js             # API client with token header injection
        └── components\
            ├── Navbar.jsx              # Header, live API health badge, logout
            ├── LoginPage.jsx           # Clean authentication portal
            ├── MessageProcessor.jsx    # XML text/file upload & extracted card
            ├── MessageInquiry.jsx      # Filterable message inquiry audit table
            └── MessageDetailModal.jsx  # Modal for extracted elements & full XML
```

---

## 3. Database Setup

1. Verify MySQL Server 8.0 is running on `localhost:3306`.
2. Connect using MySQL client:
   ```bash
   mysql -u root -p
   ```
3. Run the schema creation script provided in `schema.sql`:
   ```sql
   SOURCE D:/swift-mx/schema.sql;
   ```
4. Verify table exists:
   ```sql
   USE swift_mx_db;
   DESCRIBE swift_messages;
   ```

---

## 4. Running the Application

### A. Run Spring Boot Backend

The application does not ship with a default database password or default login credentials. Set these environment variables in the same PowerShell window before starting the backend:

```powershell
$env:DB_USERNAME = "root" # Change if your MySQL user is different
function Set-SecretEnvironmentVariable($name, $prompt) {
    $secure = Read-Host $prompt -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try {
        [Environment]::SetEnvironmentVariable(
            $name,
            [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr),
            "Process"
        )
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}
Set-SecretEnvironmentVariable "DB_PASSWORD" "Enter MySQL password"
$env:APP_AUTH_USERNAME = Read-Host "Choose the application login username"
Set-SecretEnvironmentVariable "APP_AUTH_PASSWORD" "Choose the application login password"
```

`DB_URL` is optional and defaults to `jdbc:mysql://localhost:3306/swift_mx_db`. Keep credentials private. Set the variables again in a new terminal session.

Navigate to `swift-mx`:
```powershell
cd D:\swift-mx\swift-mx
.\mvnw.cmd spring-boot:run
```
*(On Linux/macOS: `./mvnw spring-boot:run`, after exporting the same environment variables.)*

The backend starts on port **8080**.
Verify backend health:
```bash
curl http://localhost:8080/api/health
# Response: {"status":"UP","application":"SWIFT MX Message Processing","database":"Connected"}
```

### B. Run React Frontend
In a new terminal window:
```bash
cd D:\swift-mx\frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 5. Security & Authentication Model

### Credentials and session tokens

- **No default application username or password is embedded in runtime configuration.** Supply `APP_AUTH_USERNAME` and `APP_AUTH_PASSWORD` through environment variables before starting the backend.
- Supply `DB_PASSWORD` through an environment variable. `DB_USERNAME` defaults to `root` for local development; use a least-privileged MySQL account for production.
- Never commit credentials, `.env` files containing secrets, or real banking XML to source control.
- **Session tokens**: successful login returns a random UUID-based token. The current implementation stores tokens in memory and invalidates them on logout.
- **API protection**: every endpoint under `/api/messages/**` is intercepted and requires `Authorization: Bearer <token>`.
- **Logout and session check**: `/api/auth/logout` and `/api/auth/check` are excluded from the interceptor so a client can submit/check its token; logout removes the supplied token if active.
- **XXE defense**: the XML parser disables `DOCTYPE`, external general entities, external parameter entities, and external DTD loading.
- This token store has no expiry and is not shared between multiple backend instances. Use a managed session store, expiration, HTTPS, login throttling, and stronger credential management before production deployment.

---

## 6. REST API Reference

### Public endpoints
- `GET /api/health` — Checks application and database connectivity.
- `POST /api/auth/login` — Authenticates credentials and returns a session token.
- `POST /api/auth/logout` — Removes the supplied token if active; does not require an already-valid session.
- `GET /api/auth/check` — Reports whether the supplied token is currently active.

### Protected message endpoints (`Authorization: Bearer <token>` required)
- `POST /api/messages` — Accepts JSON payload:
  ```json
  { "xmlContent": "<?xml version=\"1.0\"...>" }
  ```
- `POST /api/messages/upload` — Accepts `multipart/form-data` with `file=@sample.xml`.
- `POST /api/messages/raw` — Accepts raw XML text body (`Content-Type: application/xml`).
- `GET /api/messages` — Returns array of all stored messages (newest first).
- `GET /api/messages/search?query=MSG-2026` — Filters messages across message ID, transaction reference, sender, receiver, and message type.
- `GET /api/messages/{id}` — Returns complete message details including `originalXml`.

---

## 7. SWIFT MX (`pacs.008`) Parsing Details

### Field Extraction Mapping
| Target Field | ISO 20022 XML Elements | Fallback Elements |
| :--- | :--- | :--- |
| **Message Type** | XML Namespace (`pacs.008.001.08`) | `AppHdr/MsgDefIdr` or `FIToFICstmrCdtTrf` |
| **Message ID** | `GrpHdr/MsgId` | `AppHdr/BizMsgIdr` |
| **Creation Date** | `GrpHdr/CreDtTm` | `AppHdr/CreDt` |
| **Sender** | `DbtrAgt/FinInstnId/BICFI`, `Dbtr/Nm` | `AppHdr/Fr/.../BICFI` |
| **Receiver** | `CdtrAgt/FinInstnId/BICFI`, `Cdtr/Nm` | `AppHdr/To/.../BICFI` |
| **Amount** | `CdtTrfTxInf/IntrBkSttlmAmt` | `InstdAmt` |
| **Currency** | `IntrBkSttlmAmt[@Ccy]` | Child `<Ccy>` element |
| **Transaction Ref** | `PmtId/EndToEndId` | `PmtId/TxId`, `PmtId/InstrId` |

---

## 8. Automated Tests

Run backend tests using:
```bash
cd D:\swift-mx\swift-mx
.\mvnw.cmd test
```
The test suite validates:
1. `SwiftXmlParserServiceTest`:
   - Valid `pacs.008` parsing.
   - ISO 20022 Business Application Header envelope parsing.
   - Malformed XML syntax error detection.
   - Empty payload detection.
   - Non-SWIFT XML detection.
   - XXE injection prevention.
2. `AuthServiceTest`:
   - Valid login credential verification.
   - Invalid password and invalid username rejection.
   - Session logout token invalidation.
3. `SwiftMessageIntegrationTest`:
   - Full HTTP end-to-end integration test (unauthenticated 401 check, login, message post, MySQL persistence check, query, search, detail retrieval with XML, and logout).

---

## 9. Full-Stack Developer Job Preparation & Interview Notes

### A. Core Java & Spring Boot
- **Why BigDecimal for Financial Amounts?**
  Floats and doubles use IEEE 754 binary floating-point representation, leading to precision loss (e.g., `0.1 + 0.2 != 0.3`). `BigDecimal` provides arbitrary-precision signed decimal numbers, critical for monetary calculations.
- **Spring Boot Interceptors vs Filters**:
  - `Filter` (Servlet layer): Executed before the request hits `DispatcherServlet`. Best for low-level concerns (GZIP compression, security header injection, logging).
  - `HandlerInterceptor` (Spring MVC layer): Executed after `DispatcherServlet` identifies the matching `@Controller` handler. Has access to the Spring handler method and `ModelAndView`.
- **Spring Transactional Management**:
  `@Transactional` uses dynamic proxies (JDK or CGLIB) to wrap calls in `TransactionInterceptor`, automatically committing on successful return and rolling back on `RuntimeException`.

### B. Linux / AIX Command-Line Fundamentals
When deploying Java applications on enterprise UNIX/Linux/AIX servers:
- **Process Management**:
  ```bash
  ps -ef | grep java                # List running Java processes
  kill -15 <PID>                    # Graceful shutdown (SIGTERM)
  kill -9 <PID>                     # Force kill (SIGKILL)
  top / topas (AIX)                 # CPU, memory, thread monitoring
  ```
- **Network & Port Diagnostics**:
  ```bash
  netstat -an | grep 8080           # Check listening ports
  lsof -i :8080                     # Find process ID bound to port 8080
  curl -v http://localhost:8080/api/health
  ```
- **File Systems & Permissions**:
  ```bash
  chmod 750 run.sh                  # Owner rwx, group rx, others none
  df -h / df -g (AIX)               # Disk space in gigabytes/megabytes
  tail -f /var/log/swift-mx/app.log # Live log monitoring
  ```

### C. Shell Scripting for Deployment
Automated service script (`deploy.sh`):
```bash
#!/bin/bash
set -e
APP_NAME="swift-mx"
JAR_PATH="/opt/apps/${APP_NAME}/swift-mx.jar"

echo "[INFO] Deploying ${APP_NAME}..."
PID=$(pgrep -f "${APP_NAME}.jar" || true)
if [ -n "$PID" ]; then
    echo "[INFO] Stopping process $PID..."
    kill -15 $PID
    sleep 5
fi

nohup java -jar "$JAR_PATH" --spring.profiles.active=prod > /var/log/${APP_NAME}.log 2>&1 &
echo "[INFO] ${APP_NAME} started successfully."
```

### D. CI/CD & Containerization Concepts
- **Docker**: Containerizes application along with JRE, ensuring environment parity across Dev, QA, and Production.
- **Kubernetes (K8s)**: Manages container orchestration with `Deployments` (pods, replicas, rolling updates), `Services` (load balancing), and `ConfigMaps`/`Secrets` (decoupling configuration from images).
- **CI/CD Pipeline (e.g. GitHub Actions / Jenkins)**:
  1. Trigger on git push.
  2. Run `mvn clean verify` (Unit & Integration tests).
  3. Build Docker image (`docker build`).
  4. Push image to Container Registry.
  5. Deploy to Kubernetes cluster (`kubectl rollout restart`).
