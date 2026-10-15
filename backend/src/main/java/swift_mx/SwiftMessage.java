
package swift_mx;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "swift_messages")
public class SwiftMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_type")
    private String messageType;

    @Column(name = "message_id")
    private String messageId;

    private String sender;
    private String receiver;

    @Column(name = "creation_date")
    private String creationDate;

    private BigDecimal amount;
    private String currency;

    @Column(name = "transaction_reference")
    private String transactionReference;

    @Column(name = "original_xml", nullable = false,
            columnDefinition = "LONGTEXT")
    private String originalXml;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public SwiftMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) {
        this.messageType = messageType;
    }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getReceiver() { return receiver; }
    public void setReceiver(String receiver) { this.receiver = receiver; }

    public String getCreationDate() { return creationDate; }
    public void setCreationDate(String creationDate) {
        this.creationDate = creationDate;
    }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getTransactionReference() {
        return transactionReference;
    }
    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getOriginalXml() { return originalXml; }
    public void setOriginalXml(String originalXml) {
        this.originalXml = originalXml;
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
