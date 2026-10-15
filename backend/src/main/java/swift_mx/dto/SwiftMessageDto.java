package swift_mx.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SwiftMessageDto {
    private Long id;
    private String messageType;
    private String messageId;
    private String sender;
    private String receiver;
    private String creationDate;
    private BigDecimal amount;
    private String currency;
    private String transactionReference;
    private String originalXml;
    private LocalDateTime createdAt;

    public SwiftMessageDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }

    public String getCreationDate() { return creationDate; }
    public void setCreationDate(String creationDate) { this.creationDate = creationDate; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getTransactionReference() { return transactionReference; }
    public void setTransactionReference(String transactionReference) { this.transactionReference = transactionReference; }

    public String getOriginalXml() { return originalXml; }
    public void setOriginalXml(String originalXml) { this.originalXml = originalXml; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
