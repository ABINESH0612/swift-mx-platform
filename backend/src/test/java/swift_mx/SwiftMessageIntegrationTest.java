package swift_mx;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import java.nio.charset.StandardCharsets;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
class SwiftMessageIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
    }

    @Test
    void testSecurityAndApiProtection() throws Exception {
        // Unauthenticated access to each message API must return 401
        mockMvc.perform(get("/api/messages"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/messages/search?query=test"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/messages/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/messages")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"xmlContent\":\"<test/>\"}"))
                .andExpect(status().isUnauthorized());

        MockMultipartFile upload = new MockMultipartFile(
                "file", "sample.xml", "application/xml",
                "<Document/>".getBytes(StandardCharsets.UTF_8));
        mockMvc.perform(multipart("/api/messages/upload").file(upload))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/messages/raw")
                        .contentType(MediaType.APPLICATION_XML)
                        .content("<Document/>"))
                .andExpect(status().isUnauthorized());

        // Health check must be publicly accessible
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void testFullWorkflowAndValidation() throws Exception {
        // 1. Failed login with wrong password
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());

        // 2. Successful login
        String loginRes = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"admin\",\"password\":\"admin123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String token = JsonPath.read(loginRes, "$.token");

        // 3. Error Handling: Malformed XML should return 400 Bad Request
        String malformedXml = "<Document><FIToFICstmrCdtTrf><GrpHdr></Document>";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"xmlContent\":\"" + malformedXml + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("XML Parsing Error"));

        // 4. Error Handling: Non-SWIFT XML should return 400 Bad Request
        String nonSwiftXml = "<note><to>User</to><from>Admin</from><body>Reminder</body></note>";
        mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"xmlContent\":\"" + nonSwiftXml + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid SWIFT Message"));

        // 5. Submit valid pacs.008 XML
        String xml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr>
                        <MsgId>MSG-INTTEST-999</MsgId>
                        <CreDtTm>2026-10-11T15:00:00</CreDtTm>
                    </GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId><EndToEndId>E2E-INTTEST-100</EndToEndId></PmtId>
                        <IntrBkSttlmAmt Ccy="EUR">88000.00</IntrBkSttlmAmt>
                        <Dbtr><Nm>Test Debtor Inc</Nm></Dbtr>
                        <Cdtr><Nm>Test Creditor LLC</Nm></Cdtr>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        String jsonPayload = "{\"xmlContent\":\"" + xml.replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "") + "\"}";

        String postRes = mockMvc.perform(post("/api/messages")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.messageId").value("MSG-INTTEST-999"))
                .andExpect(jsonPath("$.currency").value("EUR"))
                .andExpect(jsonPath("$.amount").value(88000.00))
                .andExpect(jsonPath("$.transactionReference").value("E2E-INTTEST-100"))
                .andReturn().getResponse().getContentAsString();

        Number msgIdNumber = JsonPath.read(postRes, "$.id");
        long messageId = msgIdNumber.longValue();

        // 6. Retrieve list of messages
        mockMvc.perform(get("/api/messages")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())));

        // 7. Search messages
        mockMvc.perform(get("/api/messages/search?query=INTTEST")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].messageId").value("MSG-INTTEST-999"));

        // 8. Retrieve message detail by ID
        mockMvc.perform(get("/api/messages/" + messageId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value((int) messageId))
                .andExpect(jsonPath("$.originalXml", containsString("MSG-INTTEST-999")));

        // 9. Logout
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 10. Access after logout must return 401
        mockMvc.perform(get("/api/messages")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }
}
