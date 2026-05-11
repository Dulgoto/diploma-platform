package com.diploma.project.repository;

import com.diploma.project.model.entity.Notification;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUser_EmailOrderByCreatedAtDesc(String email);

    Optional<Notification> findByIdAndUser_Email(Long id, String email);
}
