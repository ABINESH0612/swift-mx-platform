# SWIFT MX Platform — Independent Audit Report

Audit basis: uploaded source archive `swift-mx (2).zip`. Source was inspected directly. No access to the user's Windows runtime, live MySQL service, or production deployment was available.

## Evidence and commands

### Archived evidence (not a fresh run)
The ZIP contained Maven Surefire reports for:
- `SwiftXmlParserServiceTest`: 6 tests, 0 failures/errors
- `AuthServiceTest`: 4 tests, 0 failures/errors
- `SwiftMessageIntegrationTest`: 2 tests, 0 failures/errors
- `SwiftMxApplicationTests`: 1 test, 0 failures/errors

Total in archived reports: 13 tests, 0 failures, 0 errors, 0 skipped. These reports describe an earlier run on the user's Windows machine and do not verify the patched files in this bundle.

### Commands actually attempted in the audit environment
- `node --version` → v22.16.0
- `npm --version` → 10.9.2
- `java -version` → OpenJDK 21
- `mvn -version` → failed; Maven is not installed in the audit environment.
- `bash ./mvnw -q test` → failed before tests because the wrapper could not fetch Maven from Maven Central.
- `npm run build` → failed because the extracted Vite executable did not have Linux execute permission.
- `node node_modules/vite/bin/vite.js build` → failed because the uploaded `node_modules` contains Windows-specific Rolldown native bindings, not a Linux binding.
- `npm ci` → timed out before completion.

Therefore, no fresh backend test result, frontend production build result, or live MySQL persistence result is claimed. The patched test sources contain 17 test methods by count, but that count is not a test result and remains unverified.

## Confirmed findings and changes in this patched bundle

1. **Default credentials in runtime configuration and login UI — fixed in this bundle.**
   - Removed database-password and application-login defaults from `application.properties`.
   - Removed the fallback username/password values from `AuthService`.
   - Cleared prefilled login credentials and removed the credential hint from `LoginPage.jsx`.
   - Updated README setup instructions to require environment variables.
   - Test-only credentials remain in automated tests; they are not runtime defaults.

2. **Unsupported MX message types could be accepted — fixed in this bundle.**
   - Parser now detects pacs message definitions in namespaces and rejects types other than pacs.008.
   - Added a test for a pacs.009 message carrying plausible transaction fields.

3. **Malformed monetary amount could be silently stored as null — fixed in this bundle.**
   - An unparseable amount now produces an invalid-message error instead of continuing with a null amount.
   - Added an automated test for invalid amount text.

4. **Health endpoint always reported the database as connected — fixed in this bundle.**
   - `/api/health` now attempts a real `DataSource` connection and returns `503` with `DOWN` when the check fails.

5. **Missing required pacs.008 fields were not consistently rejected — fixed in this bundle.**
   - Message ID, monetary amount, currency, and transaction reference are now required for this application's pacs.008 processing scope.
   - Added a test for a message missing its amount.

6. **Passwords were trimmed before comparison — fixed in this bundle.**
   - Passwords are now compared exactly as entered.
   - Added a test that a password with an extra trailing space is not accepted.

7. **Message API authorization test coverage was incomplete — improved in this bundle.**
   - Added unauthenticated checks for multipart upload and raw XML endpoints. The interceptor already applies to `/api/messages` and `/api/messages/**`.

8. **Oversized upload response status — fixed in this bundle.**
   - Uploads exceeding the configured limit now return HTTP `413 Payload Too Large`, rather than HTTP 400 with a 413-style message.

9. **README claims corrected.**
   - Java compiler target is documented as 21 rather than claiming the project targets Java 25.
   - Logout and token-check endpoint access is described accurately.
   - Security and session-store limitations are documented.

## Database mapping review

The JPA entity and SQL schema appear aligned by source inspection:
- `swift_messages` table and identity `BIGINT` ID
- message fields map to the matching snake_case columns
- `BigDecimal` amount aligns with `DECIMAL(20,5)`
- `original_xml` maps to `LONGTEXT`
- `created_at` is database-generated and read-only in the entity

This is a source-level mapping review only. I did not connect to the user's MySQL instance or run `SHOW CREATE TABLE` against it.

The schema script uses `CREATE DATABASE IF NOT EXISTS` and `CREATE TABLE IF NOT EXISTS`. Its `DROP TABLE` line is commented out, so the script does not intentionally delete existing message data.

## Remaining risks / limitations

- **Fresh test/build status remains unverified.** Run the commands below on the Windows project after applying the patch.
- **Token lifecycle:** tokens are held in an in-memory map, have no expiry, and disappear after a restart. Multiple backend instances would not share sessions.
- **Authentication model:** one configured username/password is shared by all users; there is no user table, password hashing, roles, or login throttling.
- **Browser token storage:** frontend stores bearer tokens in `localStorage`, which increases exposure if a cross-site scripting issue is introduced.
- **Transport:** production use requires HTTPS and proper deployment secrets management.
- **CORS:** current allowed origins are localhost development origins. Configure the exact production frontend origin before deployment.
- **XML validation:** parsing is namespace-aware and disables DOCTYPE/external entities, but it is not full ISO 20022 XSD validation. Recursive local-name lookup can select the first matching field when a message contains multiple transactions.
- **Production database user:** `DB_USERNAME` still defaults to `root` for local convenience. Use a least-privileged MySQL account in production.
- **No live deployment audit:** TLS, hosting configuration, reverse proxy, logs, and production secrets were not accessible from the archive.

## Re-run after applying the patch

In PowerShell, set `DB_PASSWORD`, `APP_AUTH_USERNAME`, and `APP_AUTH_PASSWORD` in the backend terminal as described in `README.md`, then run:

```powershell
cd D:\swift-mx\swift-mx
.\mvnw.cmd clean test
```

In another terminal:

```powershell
cd D:\swift-mx\frontend
npm ci
npm run build
```

Only after these commands complete successfully should the patched source be treated as freshly verified.
