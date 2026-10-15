package swift_mx;

import static org.junit.jupiter.api.Assertions.*;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import swift_mx.exception.InvalidMessageException;
import swift_mx.exception.XmlParseException;
import swift_mx.service.SwiftXmlParserService;

/**
 * Unit tests for SwiftXmlParserService.
 *
 * Covers:
 *  - Valid pacs.008.001.08 Document root (namespace-based detection)
 *  - Valid pacs.008.001.08 wrapped in an AppHdr business envelope
 *  - Unsupported namespace (pacs.009)
 *  - Missing / invalid namespace
 *  - Malformed XML and XXE injection attempts
 *  - Field-level validation (missing amount, currency, transaction reference)
 */
class SwiftXmlParserServiceTest {

    private SwiftXmlParserService parserService;

    @BeforeEach
    void setUp() {
        parserService = new SwiftXmlParserService();
    }

    // ─────────────────────────────────────────────────────────────────
    // VALID MESSAGES
    // ─────────────────────────────────────────────────────────────────

    /**
     * Regression test: the root element is <Document> with
     * xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08".
     * The parser must recognise the type from the namespace URI, NOT from
     * the local-name "Document", which previously caused:
     *   "Unsupported SWIFT MX message type: Document."
     */
    @Test
    void testParseValidPacs008MessageWithDocumentRootElement() {
        String xml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr>
                        <MsgId>MSG-2026-TEST-001</MsgId>
                        <CreDtTm>2026-10-11T10:00:00</CreDtTm>
                        <NbOfTxs>1</NbOfTxs>
                    </GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId>
                            <EndToEndId>E2E-REF-12345</EndToEndId>
                        </PmtId>
                        <IntrBkSttlmAmt Ccy="EUR">75000.50</IntrBkSttlmAmt>
                        <Dbtr><Nm>Alpha Corp</Nm></Dbtr>
                        <DbtrAgt><FinInstnId><BICFI>ALPHAFRPPXXX</BICFI></FinInstnId></DbtrAgt>
                        <CdtrAgt><FinInstnId><BICFI>BETADEDDXXX</BICFI></FinInstnId></CdtrAgt>
                        <Cdtr><Nm>Beta Ltd</Nm></Cdtr>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        SwiftMessage msg = parserService.parse(xml);

        assertNotNull(msg);
        // Message type must be derived from namespace, resolving to pacs.008.001.08
        assertEquals("pacs.008.001.08", msg.getMessageType());
        assertEquals("MSG-2026-TEST-001", msg.getMessageId());
        assertEquals("2026-10-11T10:00:00", msg.getCreationDate());
        assertEquals("ALPHAFRPPXXX", msg.getSender());
        assertEquals("BETADEDDXXX", msg.getReceiver());
        assertEquals(new BigDecimal("75000.50"), msg.getAmount());
        assertEquals("EUR", msg.getCurrency());
        assertEquals("E2E-REF-12345", msg.getTransactionReference());
        assertEquals(xml.trim(), msg.getOriginalXml());
    }

    // Keep alias so callers using the old test name still compile
    @Test
    void testParseValidPacs008Message() {
        testParseValidPacs008MessageWithDocumentRootElement();
    }

    /**
     * Regression test: pacs.008 message wrapped in a Business Application Header
     * (ISO 20022 head.001 AppHdr envelope). The MsgDefIdr inside AppHdr identifies
     * the payload as pacs.008.001.08.
     */
    @Test
    void testParseValidPacs008WrappedInAppHdrEnvelope() {
        String xml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <RequestPayload>
                <AppHdr xmlns="urn:iso:std:iso:20022:tech:xsd:head.001.001.01">
                    <Fr><FIId><FinInstnId><BICFI>CHASSUS33XXX</BICFI></FinInstnId></FIId></Fr>
                    <To><FIId><FinInstnId><BICFI>BARCGB22XXX</BICFI></FinInstnId></FIId></To>
                    <BizMsgIdr>BIZ-9988</BizMsgIdr>
                    <MsgDefIdr>pacs.008.001.08</MsgDefIdr>
                </AppHdr>
                <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                    <FIToFICstmrCdtTrf>
                        <GrpHdr>
                            <MsgId>MSG-HEAD-001</MsgId>
                            <CreDtTm>2026-10-11T12:00:00</CreDtTm>
                        </GrpHdr>
                        <CdtTrfTxInf>
                            <PmtId><EndToEndId>E2E-ENV-001</EndToEndId></PmtId>
                            <IntrBkSttlmAmt Ccy="USD">100000.00</IntrBkSttlmAmt>
                        </CdtTrfTxInf>
                    </FIToFICstmrCdtTrf>
                </Document>
            </RequestPayload>
            """;

        SwiftMessage msg = parserService.parse(xml);

        assertNotNull(msg);
        assertEquals("pacs.008.001.08", msg.getMessageType());
        assertEquals("MSG-HEAD-001", msg.getMessageId());
        assertEquals("CHASSUS33XXX", msg.getSender());
        assertEquals("BARCGB22XXX", msg.getReceiver());
        assertEquals(new BigDecimal("100000.00"), msg.getAmount());
        assertEquals("USD", msg.getCurrency());
        assertEquals("E2E-ENV-001", msg.getTransactionReference());
    }

    // Keep alias so callers using the old test name still compile
    @Test
    void testParseWithBusinessApplicationHeader() {
        testParseValidPacs008WrappedInAppHdrEnvelope();
    }

    // ─────────────────────────────────────────────────────────────────
    // UNSUPPORTED NAMESPACE
    // ─────────────────────────────────────────────────────────────────

    /**
     * Regression test: a well-formed XML document whose namespace is
     * pacs.009 (Financial Institution Credit Transfer) must be rejected,
     * even if it contains ISO 20022-like field names.
     */
    @Test
    void testRejectsUnsupportedPacs009NamespaceEvenWhenFieldsExist() {
        String unsupported = """
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.009.001.10">
                <FICdtTrf>
                    <GrpHdr><MsgId>UNSUPPORTED-001</MsgId></GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId><EndToEndId>REF-001</EndToEndId></PmtId>
                        <IntrBkSttlmAmt Ccy="EUR">12.34</IntrBkSttlmAmt>
                    </CdtTrfTxInf>
                </FICdtTrf>
            </Document>
            """;

        InvalidMessageException ex = assertThrows(
                InvalidMessageException.class,
                () -> parserService.parse(unsupported));

        assertTrue(ex.getMessage().contains("pacs.009") || ex.getMessage().contains("pacs.008"),
                "Exception message should mention the detected or required type");
    }

    // Keep alias for old test name
    @Test
    void testRejectsUnsupportedPacsMessageTypeEvenWhenFieldsExist() {
        testRejectsUnsupportedPacs009NamespaceEvenWhenFieldsExist();
    }

    // ─────────────────────────────────────────────────────────────────
    // INVALID / MISSING NAMESPACE
    // ─────────────────────────────────────────────────────────────────

    /**
     * Regression test: A plain XML document with no namespace at all.
     * The previous code would fall through to returning the local-name
     * ("Document") and then fail with an unhelpful error.
     * The corrected code must throw InvalidMessageException immediately
     * because no ISO 20022 namespace is present.
     */
    @Test
    void testRejectsMissingNamespace() {
        String noNamespace = """
            <?xml version="1.0" encoding="UTF-8"?>
            <Document>
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>NO-NS-001</MsgId></GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId><EndToEndId>REF-NO-NS</EndToEndId></PmtId>
                        <IntrBkSttlmAmt Ccy="EUR">1000.00</IntrBkSttlmAmt>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(noNamespace));
    }

    /**
     * Non-SWIFT / non-ISO-20022 XML with an unrecognised namespace must be rejected.
     */
    @Test
    void testRejectsUnrecognisedIso20022Namespace() {
        String wrongNs = """
            <Payment xmlns="http://example.com/payments/v1">
                <Amount currency="EUR">5000.00</Amount>
                <Reference>REF-WRONG-NS</Reference>
            </Payment>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(wrongNs));
    }

    /**
     * A non-SWIFT XML document without any namespace (e.g. a plain note).
     */
    @Test
    void testParseNonSwiftXmlThrowsInvalidMessageException() {
        String nonSwift = """
            <note>
                <to>Alice</to>
                <from>Bob</from>
                <body>Hello</body>
            </note>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(nonSwift));
    }

    // ─────────────────────────────────────────────────────────────────
    // SECURITY: MALFORMED XML AND XXE
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testParseMalformedXmlThrowsXmlParseException() {
        String malformed = "<Document><FIToFICstmrCdtTrf><GrpHdr></Document>";
        assertThrows(XmlParseException.class, () -> parserService.parse(malformed));
    }

    @Test
    void testParseEmptyXmlThrowsXmlParseException() {
        assertThrows(XmlParseException.class, () -> parserService.parse("   "));
    }

    @Test
    void testParseNullContentThrowsXmlParseException() {
        assertThrows(XmlParseException.class, () -> parserService.parse(null));
    }

    /**
     * Classic XXE injection using a local file entity reference.
     * The parser must reject it because DTD declarations are disallowed.
     */
    @Test
    void testDisallowsXxeInjection() {
        String xxePayload = """
            <?xml version="1.0" encoding="ISO-8859-1"?>
            <!DOCTYPE foo [
            <!ELEMENT foo ANY >
            <!ENTITY xxe SYSTEM "file:///c:/windows/win.ini" >]>
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>&xxe;</MsgId></GrpHdr>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(XmlParseException.class, () -> parserService.parse(xxePayload));
    }

    /**
     * External DTD declaration must also be rejected.
     */
    @Test
    void testDisallowsExternalDtdDeclaration() {
        String externalDtdXml = """
            <?xml version="1.0" encoding="UTF-8"?>
            <!DOCTYPE Document SYSTEM "http://example.com/external.dtd">
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>EXT-DTD-001</MsgId></GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId><EndToEndId>REF-EXT</EndToEndId></PmtId>
                        <IntrBkSttlmAmt Ccy="EUR">500.00</IntrBkSttlmAmt>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(XmlParseException.class, () -> parserService.parse(externalDtdXml));
    }

    // ─────────────────────────────────────────────────────────────────
    // FIELD-LEVEL VALIDATION
    // ─────────────────────────────────────────────────────────────────

    @Test
    void testRejectsInvalidMonetaryAmount() {
        String invalidAmount = """
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>INVALID-AMOUNT-001</MsgId></GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId><EndToEndId>REF-002</EndToEndId></PmtId>
                        <IntrBkSttlmAmt Ccy="EUR">not-a-number</IntrBkSttlmAmt>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(invalidAmount));
    }

    @Test
    void testRejectsMissingRequiredPacs008Fields() {
        String missingAmount = """
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>MISSING-AMOUNT-001</MsgId></GrpHdr>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(missingAmount));
    }

    @Test
    void testRejectsMissingCurrencyCode() {
        String missingCcy = """
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>MISSING-CCY-001</MsgId></GrpHdr>
                    <CdtTrfTxInf>
                        <PmtId><EndToEndId>REF-NO-CCY</EndToEndId></PmtId>
                        <IntrBkSttlmAmt>12345.00</IntrBkSttlmAmt>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(missingCcy));
    }

    @Test
    void testRejectsMissingTransactionReference() {
        String missingTxRef = """
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <FIToFICstmrCdtTrf>
                    <GrpHdr><MsgId>MISSING-TXREF-001</MsgId></GrpHdr>
                    <CdtTrfTxInf>
                        <IntrBkSttlmAmt Ccy="USD">50000.00</IntrBkSttlmAmt>
                    </CdtTrfTxInf>
                </FIToFICstmrCdtTrf>
            </Document>
            """;

        assertThrows(InvalidMessageException.class, () -> parserService.parse(missingTxRef));
    }

    /**
     * A pacs.008 message that is missing the FIToFICstmrCdtTrf structure
     * entirely must be rejected with an InvalidMessageException, not
     * proceed to field extraction.
     */
    @Test
    void testRejectsPacs008WithMissingFIToFIStructure() {
        String missingStructure = """
            <Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
                <SomeOtherElement>
                    <MsgId>WRONG-STRUCTURE-001</MsgId>
                </SomeOtherElement>
            </Document>
            """;

        InvalidMessageException ex = assertThrows(
                InvalidMessageException.class,
                () -> parserService.parse(missingStructure));

        assertTrue(ex.getMessage().contains("FIToFICstmrCdtTrf"),
                "Exception should mention the missing required structure element");
    }
}
