package com.diploma.project.repository;

import com.diploma.project.model.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query(
            "SELECT m FROM Message m "
                    + "WHERE (m.sender.id = :userAId AND m.receiver.id = :userBId) "
                    + "OR (m.sender.id = :userBId AND m.receiver.id = :userAId) "
                    + "ORDER BY m.createdAt ASC")
    List<Message> findChatMessages(@Param("userAId") Long userAId, @Param("userBId") Long userBId);

    @Query(
            "SELECT m FROM Message m "
                    + "WHERE m.sender.id = :userId OR m.receiver.id = :userId "
                    + "ORDER BY m.createdAt DESC")
    List<Message> findConversationsForUser(@Param("userId") Long userId);

    List<Message> findBySender_IdAndReceiver_IdAndReadStatusFalse(Long senderId, Long receiverId);
}
