package swift_mx.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import swift_mx.SwiftMessage;
import swift_mx.dto.SwiftMessageDto;
import swift_mx.exception.ResourceNotFoundException;
import swift_mx.repository.SwiftMessageRepository;

@Service
public class SwiftMessageService {

    private final SwiftMessageRepository repository;
    private final SwiftXmlParserService xmlParserService;

    public SwiftMessageService(SwiftMessageRepository repository, SwiftXmlParserService xmlParserService) {
        this.repository = repository;
        this.xmlParserService = xmlParserService;
    }

    @Transactional
    public SwiftMessageDto processAndSave(String xmlContent) {
        SwiftMessage message = xmlParserService.parse(xmlContent);
        SwiftMessage saved = repository.save(message);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageDto> getAllMessages() {
        return repository.findAllByOrderByIdDesc()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SwiftMessageDto> searchMessages(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllMessages();
        }
        return repository.searchMessages(query.trim())
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SwiftMessageDto getMessageById(Long id) {
        SwiftMessage message = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SWIFT MX Message with ID " + id + " not found."));
        return mapToDto(message);
    }

    private SwiftMessageDto mapToDto(SwiftMessage entity) {
        SwiftMessageDto dto = new SwiftMessageDto();
        dto.setId(entity.getId());
        dto.setMessageType(entity.getMessageType());
        dto.setMessageId(entity.getMessageId());
        dto.setSender(entity.getSender());
        dto.setReceiver(entity.getReceiver());
        dto.setCreationDate(entity.getCreationDate());
        dto.setAmount(entity.getAmount());
        dto.setCurrency(entity.getCurrency());
        dto.setTransactionReference(entity.getTransactionReference());
        dto.setOriginalXml(entity.getOriginalXml());
        dto.setCreatedAt(entity.getCreatedAt());
        return dto;
    }
}
