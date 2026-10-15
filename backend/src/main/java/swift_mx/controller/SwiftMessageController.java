package swift_mx.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import swift_mx.dto.MessageProcessRequest;
import swift_mx.dto.SwiftMessageDto;
import swift_mx.exception.XmlParseException;
import swift_mx.service.SwiftMessageService;

@RestController
@RequestMapping("/api/messages")
@Validated
public class SwiftMessageController {

    private final SwiftMessageService messageService;

    public SwiftMessageController(SwiftMessageService messageService) {
        this.messageService = messageService;
    }

    /**
     * Submit SWIFT MX message as JSON containing XML string.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<SwiftMessageDto> processMessageJson(@Valid @RequestBody MessageProcessRequest request) {
        SwiftMessageDto saved = messageService.processAndSave(request.getXmlContent());
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    /**
     * Submit SWIFT MX message as uploaded XML file.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<SwiftMessageDto> processMessageFile(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new XmlParseException("Uploaded file is empty or missing.");
        }
        try {
            String xmlContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            SwiftMessageDto saved = messageService.processAndSave(xmlContent);
            return new ResponseEntity<>(saved, HttpStatus.CREATED);
        } catch (IOException e) {
            throw new XmlParseException("Failed to read uploaded XML file: " + e.getMessage(), e);
        }
    }

    /**
     * Submit raw XML payload.
     */
    @PostMapping(value = "/raw", consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.TEXT_PLAIN_VALUE, MediaType.TEXT_XML_VALUE})
    public ResponseEntity<SwiftMessageDto> processRawXml(@RequestBody String rawXml) {
        SwiftMessageDto saved = messageService.processAndSave(rawXml);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    /**
     * Retrieve all processed messages.
     */
    @GetMapping
    public ResponseEntity<List<SwiftMessageDto>> getAllMessages() {
        return ResponseEntity.ok(messageService.getAllMessages());
    }

    /**
     * Search processed messages by query.
     */
    @GetMapping("/search")
    public ResponseEntity<List<SwiftMessageDto>> searchMessages(@RequestParam(value = "query", required = false, defaultValue = "") String query) {
        return ResponseEntity.ok(messageService.searchMessages(query));
    }

    /**
     * Retrieve a specific message by ID including original XML.
     */
    @GetMapping("/{id}")
    public ResponseEntity<SwiftMessageDto> getMessageById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(messageService.getMessageById(id));
    }
}
