package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.MessageDto;
import com.diploma.project.model.dto.MessageRequest;
import com.diploma.project.model.entity.Message;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.MessageRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.MessageService;
import com.diploma.project.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class MessageServiceImpl implements MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public MessageServiceImpl(
            MessageRepository messageRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public MessageDto sendMessage(Long receiverId, String senderEmail, MessageRequest request) {
        User sender =
                userRepository
                        .findByEmail(senderEmail)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        User receiver =
                userRepository
                        .findById(receiverId)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        if (sender.getId().equals(receiver.getId())) {
            throw new BadRequestException("You cannot send a message to yourself");
        }
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(request.getContent());
        message.setReadStatus(false);
        Message saved = messageRepository.save(message);
        notificationService.createNotification(
                receiver.getId(),
                "New message received",
                sender.getName() + " sent you a new message.");
        return toMessageDto(saved);
    }

    @Override
    @Transactional
    public List<MessageDto> getChat(Long otherUserId, String currentUserEmail) {
        User currentUser =
                userRepository
                        .findByEmail(currentUserEmail)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        User otherUser =
                userRepository
                        .findById(otherUserId)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        List<Message> unread =
                messageRepository.findBySender_IdAndReceiver_IdAndReadStatusFalse(
                        otherUser.getId(), currentUser.getId());

        if (!unread.isEmpty()) {
            for (Message m : unread) {
                m.setReadStatus(true);
            }
            messageRepository.saveAll(unread);
        }

        return messageRepository.findChatMessages(currentUser.getId(), otherUser.getId()).stream()
                .map(MessageServiceImpl::toMessageDto)
                .toList();
    }

    @Override
    public List<MessageDto> getMyConversations(String currentUserEmail) {
        User currentUser =
                userRepository
                        .findByEmail(currentUserEmail)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        return messageRepository.findConversationsForUser(currentUser.getId()).stream()
                .map(MessageServiceImpl::toMessageDto)
                .toList();
    }

    private static MessageDto toMessageDto(Message message) {
        User sender = message.getSender();
        User receiver = message.getReceiver();
        return new MessageDto(
                message.getId(),
                sender != null ? sender.getId() : null,
                sender != null ? sender.getName() : null,
                sender != null ? sender.getAvatarKey() : null,
                receiver != null ? receiver.getId() : null,
                receiver != null ? receiver.getName() : null,
                receiver != null ? receiver.getAvatarKey() : null,
                message.getContent(),
                message.getReadStatus(),
                message.getCreatedAt());
    }
}
