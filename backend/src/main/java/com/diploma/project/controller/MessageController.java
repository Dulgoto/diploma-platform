package com.diploma.project.controller;

import com.diploma.project.model.dto.MessageDto;
import com.diploma.project.model.dto.MessageRequest;
import com.diploma.project.service.MessageService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/users/{userId}")
    public ResponseEntity<MessageDto> sendMessage(
            @PathVariable Long userId,
            @Valid @RequestBody MessageRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.status(201).body(messageService.sendMessage(userId, email, request));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<MessageDto>> getChat(
            @PathVariable Long userId, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.getChat(userId, email));
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<MessageDto>> getMyConversations(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(messageService.getMyConversations(email));
    }
}
