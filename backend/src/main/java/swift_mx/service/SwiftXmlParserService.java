package swift_mx.service;

import java.io.StringReader;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;

import swift_mx.SwiftMessage;
import swift_mx.exception.InvalidMessageException;
import swift_mx.exception.XmlParseException;

@Service
public class SwiftXmlParserService {

    private static final Logger log = LoggerFactory.getLogger(SwiftXmlParserService.class);

    private final DocumentBuilderFactory dbf;

    public SwiftXmlParserService() {
        this.dbf = DocumentBuilderFactory.newInstance();
        configureSecureFactory(this.dbf);
    }

    private void configureSecureFactory(DocumentBuilderFactory factory) {
        try {
            factory.setNamespaceAware(true);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);

            // Disallow DTDs entirely to prevent XXE (XML External Entity) attacks
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        } catch (ParserConfigurationException e) {
            log.error("Unable to configure XML parser securely", e);
            throw new IllegalStateException("Failed to configure secure XML parser", e);
        }
    }

    public static final String PACS_008_NAMESPACE = "urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08";
    public static final String SUPPORTED_MESSAGE_TYPE = "pacs.008";

    public SwiftMessage parse(String xmlContent) {
        if (xmlContent == null || xmlContent.trim().isEmpty()) {
            throw new XmlParseException("XML content cannot be empty or blank.");
        }

        Document document;
        try {
            DocumentBuilder builder = dbf.newDocumentBuilder();
            // Custom error handler to prevent logging warnings to console
            builder.setErrorHandler(null);
            document = builder.parse(new InputSource(new StringReader(xmlContent.trim())));
        } catch (SAXParseException e) {
            throw new XmlParseException(String.format("Malformed XML at line %d, column %d: %s",
                    e.getLineNumber(), e.getColumnNumber(), e.getMessage()), e);
        } catch (SAXException e) {
            throw new XmlParseException("Failed to parse XML: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new XmlParseException("Unexpected XML parsing error: " + e.getMessage(), e);
        }

        Element rootElement = document.getDocumentElement();
        if (rootElement == null) {
            throw new InvalidMessageException("Empty XML document with no root element.");
        }

        // Determine and validate the message type before extracting fields.
        // This application currently supports pacs.008 credit-transfer messages only.
        String messageType = detectMessageType(rootElement);
        if (messageType == null ||
                !(messageType.equalsIgnoreCase(SUPPORTED_MESSAGE_TYPE) ||
                  messageType.toLowerCase(java.util.Locale.ROOT).startsWith(SUPPORTED_MESSAGE_TYPE + "."))) {
            throw new InvalidMessageException(
                    "Unsupported SWIFT MX message type: " + messageType +
                    ". This application currently supports pacs.008 only.");
        }

        // Validate the required FIToFICstmrCdtTrf message structure
        Element fiToFiElement = findFirstElementByLocalName(rootElement, "FIToFICstmrCdtTrf");
        if (fiToFiElement == null) {
            throw new InvalidMessageException("Missing required pacs.008 message structure (FIToFICstmrCdtTrf).");
        }

        // Extract Message ID
        String messageId = findFirstTextByLocalName(rootElement, "MsgId");
        if (messageId == null || messageId.isBlank()) {
            messageId = findFirstTextByLocalName(rootElement, "BizMsgIdr");
        }

        // Extract Creation Date
        String creationDate = findFirstTextByLocalName(rootElement, "CreDtTm");
        if (creationDate == null || creationDate.isBlank()) {
            creationDate = findFirstTextByLocalName(rootElement, "CreDt");
        }

        // Extract Sender
        String sender = extractSender(rootElement);

        // Extract Receiver
        String receiver = extractReceiver(rootElement);

        // Extract Amount & Currency
        Element amountElement = findFirstElementByLocalNames(rootElement, "IntrBkSttlmAmt", "InstdAmt", "Amt");
        BigDecimal amount = null;
        String currency = null;
        if (amountElement != null) {
            currency = amountElement.getAttribute("Ccy");
            if (currency == null || currency.isBlank()) {
                currency = findFirstTextByLocalName(amountElement, "Ccy");
            }
            String amtStr = amountElement.getTextContent();
            if (amtStr != null && !amtStr.isBlank()) {
                try {
                    amount = new BigDecimal(amtStr.trim());
                } catch (NumberFormatException e) {
                    throw new InvalidMessageException(
                            "Invalid monetary amount in XML: '" + amtStr.trim() + "'.");
                }
            }
        }

        // Extract Transaction Reference
        String transactionReference = findFirstTextByLocalName(rootElement, "EndToEndId");
        if (transactionReference == null || transactionReference.isBlank()) {
            transactionReference = findFirstTextByLocalName(rootElement, "TxId");
        }
        if (transactionReference == null || transactionReference.isBlank()) {
            transactionReference = findFirstTextByLocalName(rootElement, "InstrId");
        }
        if (transactionReference == null || transactionReference.isBlank()) {
            transactionReference = findFirstTextByLocalName(rootElement, "UETR");
        }

        // Validate fields required by this application's pacs.008 processing scope.
        if (messageId == null || messageId.isBlank()) {
            throw new InvalidMessageException("Missing required message identifier (MsgId or BizMsgIdr).");
        }
        if (amount == null) {
            throw new InvalidMessageException("Missing or invalid monetary amount (IntrBkSttlmAmt, InstdAmt, or Amt).");
        }
        if (currency == null || currency.isBlank()) {
            throw new InvalidMessageException("Missing required currency code on the monetary amount.");
        }
        if (transactionReference == null || transactionReference.isBlank()) {
            throw new InvalidMessageException("Missing transaction reference (EndToEndId, TxId, InstrId, or UETR).");
        }

        SwiftMessage message = new SwiftMessage();
        message.setMessageType(messageType != null ? messageType : "pacs.008");
        message.setMessageId(messageId != null ? messageId.trim() : "UNKNOWN_MSG_ID");
        message.setSender(sender != null ? sender.trim() : null);
        message.setReceiver(receiver != null ? receiver.trim() : null);
        message.setCreationDate(creationDate != null ? creationDate.trim() : null);
        message.setAmount(amount);
        message.setCurrency(currency != null ? currency.trim() : null);
        message.setTransactionReference(transactionReference != null ? transactionReference.trim() : null);
        message.setOriginalXml(xmlContent.trim());

        return message;
    }

    private String detectMessageType(Element root) {
        // 1. Check Business Application Header (AppHdr) MsgDefIdr if envelope is present
        String msgDefIdr = findFirstTextByLocalName(root, "MsgDefIdr");
        if (msgDefIdr != null && !msgDefIdr.isBlank()) {
            return msgDefIdr.trim();
        }

        // 2. Extract namespace URI from root element using namespace-aware XML parser
        String ns = root.getNamespaceURI();

        // If root is an envelope wrapper (e.g. <RequestPayload>), check <Document> child namespace
        if (ns == null || ns.isBlank()) {
            List<Element> documents = findElementsByLocalName(root, "Document");
            for (Element doc : documents) {
                String docNs = doc.getNamespaceURI();
                if (docNs != null && !docNs.isBlank()) {
                    ns = docNs;
                    break;
                }
            }
        }

        // 3. Reject missing or blank namespace
        if (ns == null || ns.isBlank()) {
            throw new InvalidMessageException(
                    "Missing XML namespace for SWIFT MX message. This application requires a valid ISO 20022 namespace (" +
                    PACS_008_NAMESPACE + ").");
        }

        // 4. Recognize pacs.008 namespace (urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08) and map to supported message type
        if (ns.contains("pacs.008")) {
            return extractPacsTypeFromNamespace(ns);
        }

        // 5. If namespace belongs to another pacs message type (e.g. pacs.009, pacs.002, pacs.004)
        if (ns.contains("pacs.")) {
            return extractPacsTypeFromNamespace(ns);
        }

        // 6. If namespace contains standard ISO 20022 schema identifier (e.g. camt.053, pain.001)
        if (ns.contains(":xsd:")) {
            int xsdIdx = ns.indexOf(":xsd:");
            String schemaPart = ns.substring(xsdIdx + 5);
            int end = schemaPart.length();
            int slash = schemaPart.indexOf('/');
            if (slash >= 0) end = Math.min(end, slash);
            int colon = schemaPart.indexOf(':');
            if (colon >= 0) end = Math.min(end, colon);
            String extractedType = schemaPart.substring(0, end);
            if (!extractedType.isBlank()) {
                return extractedType;
            }
        }

        // 7. Any other invalid or unrecognized namespace
        throw new InvalidMessageException(
                "Invalid or unsupported XML namespace: '" + ns +
                "'. This application currently supports pacs.008 only.");
    }

    private String extractPacsTypeFromNamespace(String namespace) {
        int idx = namespace.indexOf("pacs.");
        if (idx < 0) {
            return namespace;
        }
        String type = namespace.substring(idx);
        int colon = type.indexOf(':');
        int slash = type.indexOf('/');
        int end = type.length();
        if (colon >= 0) end = Math.min(end, colon);
        if (slash >= 0) end = Math.min(end, slash);
        return type.substring(0, end);
    }

    private String extractPacsVersion(String namespace) {
        int idx = namespace.indexOf("pacs.008");
        if (idx != -1) {
            String sub = namespace.substring(idx);
            // Example: pacs.008.001.08
            int end = sub.indexOf(":");
            if (end != -1) {
                return sub.substring(0, end);
            }
            int slash = sub.indexOf("/");
            if (slash != -1) {
                return sub.substring(0, slash);
            }
            return sub;
        }
        return "pacs.008";
    }

    private String extractSender(Element root) {
        // Try AppHdr Fr BICFI
        Element fr = findFirstElementByLocalName(root, "Fr");
        if (fr != null) {
            String bic = findFirstTextByLocalName(fr, "BICFI");
            if (bic != null && !bic.isBlank()) return bic;
            String bicOld = findFirstTextByLocalName(fr, "BIC");
            if (bicOld != null && !bicOld.isBlank()) return bicOld;
        }

        // Try Debtor Agent BICFI
        Element dbtrAgt = findFirstElementByLocalName(root, "DbtrAgt");
        if (dbtrAgt != null) {
            String bic = findFirstTextByLocalName(dbtrAgt, "BICFI");
            if (bic != null && !bic.isBlank()) return bic;
            String nm = findFirstTextByLocalName(dbtrAgt, "Nm");
            if (nm != null && !nm.isBlank()) return nm;
        }

        // Try Debtor Name
        Element dbtr = findFirstElementByLocalName(root, "Dbtr");
        if (dbtr != null) {
            String nm = findFirstTextByLocalName(dbtr, "Nm");
            if (nm != null && !nm.isBlank()) return nm;
        }

        // Try Initiating Party Name
        Element initgPty = findFirstElementByLocalName(root, "InitgPty");
        if (initgPty != null) {
            String nm = findFirstTextByLocalName(initgPty, "Nm");
            if (nm != null && !nm.isBlank()) return nm;
        }

        return null;
    }

    private String extractReceiver(Element root) {
        // Try AppHdr To BICFI
        Element to = findFirstElementByLocalName(root, "To");
        if (to != null) {
            String bic = findFirstTextByLocalName(to, "BICFI");
            if (bic != null && !bic.isBlank()) return bic;
            String bicOld = findFirstTextByLocalName(to, "BIC");
            if (bicOld != null && !bicOld.isBlank()) return bicOld;
        }

        // Try Creditor Agent BICFI
        Element cdtrAgt = findFirstElementByLocalName(root, "CdtrAgt");
        if (cdtrAgt != null) {
            String bic = findFirstTextByLocalName(cdtrAgt, "BICFI");
            if (bic != null && !bic.isBlank()) return bic;
            String nm = findFirstTextByLocalName(cdtrAgt, "Nm");
            if (nm != null && !nm.isBlank()) return nm;
        }

        // Try Creditor Name
        Element cdtr = findFirstElementByLocalName(root, "Cdtr");
        if (cdtr != null) {
            String nm = findFirstTextByLocalName(cdtr, "Nm");
            if (nm != null && !nm.isBlank()) return nm;
        }

        return null;
    }

    private Element findFirstElementByLocalNames(Element parent, String... localNames) {
        for (String name : localNames) {
            Element found = findFirstElementByLocalName(parent, name);
            if (found != null) {
                return found;
            }
        }
        return null;
    }

    private Element findFirstElementByLocalName(Node root, String localName) {
        if (root.getNodeType() == Node.ELEMENT_NODE) {
            Element elem = (Element) root;
            if (localName.equalsIgnoreCase(elem.getLocalName()) || localName.equalsIgnoreCase(elem.getNodeName())) {
                return elem;
            }
        }

        NodeList children = root.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child.getNodeType() == Node.ELEMENT_NODE) {
                Element found = findFirstElementByLocalName(child, localName);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }

    private List<Element> findElementsByLocalName(Node root, String localName) {
        List<Element> list = new ArrayList<>();
        collectElementsByLocalName(root, localName, list);
        return list;
    }

    private void collectElementsByLocalName(Node node, String localName, List<Element> result) {
        if (node.getNodeType() == Node.ELEMENT_NODE) {
            Element elem = (Element) node;
            if (localName.equalsIgnoreCase(elem.getLocalName()) || localName.equalsIgnoreCase(elem.getNodeName())) {
                result.add(elem);
            }
        }

        NodeList children = node.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            Node child = children.item(i);
            if (child.getNodeType() == Node.ELEMENT_NODE) {
                collectElementsByLocalName(child, localName, result);
            }
        }
    }

    private String findFirstTextByLocalName(Node root, String localName) {
        Element elem = findFirstElementByLocalName(root, localName);
        if (elem != null) {
            String text = elem.getTextContent();
            return text != null ? text.trim() : null;
        }
        return null;
    }
}
