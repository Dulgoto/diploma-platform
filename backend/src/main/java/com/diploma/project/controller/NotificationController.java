package com.diploma.project.controller;

import com.diploma.project.model.dto.NotificationDto;
import com.diploma.project.service.NotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getMyNotifications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.getMyNotifications(email));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(notificationService.markAsRead(id, email));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        String email = authentication.getName();
        notificationService.markAllAsRead(email);
        return ResponseEntity.noContent().build();
    }
}
