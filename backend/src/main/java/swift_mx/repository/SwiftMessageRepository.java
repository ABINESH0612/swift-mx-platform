package swift_mx.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import swift_mx.SwiftMessage;

@Repository
public interface SwiftMessageRepository extends JpaRepository<SwiftMessage, Long> {

    List<SwiftMessage> findByMessageIdContainingIgnoreCase(String messageId);

    List<SwiftMessage> findByTransactionReferenceContainingIgnoreCase(String reference);

    @Query("SELECT m FROM SwiftMessage m WHERE " +
           "LOWER(m.messageId) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.transactionReference) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.sender) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.receiver) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(m.messageType) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY m.id DESC")
    List<SwiftMessage> searchMessages(@Param("query") String query);

    List<SwiftMessage> findAllByOrderByIdDesc();
}
