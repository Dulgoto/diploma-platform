package com.diploma.project.service.impl;

import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.NotificationDto;
import com.diploma.project.model.entity.Notification;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.NotificationRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<NotificationDto> getMyNotifications(String email) {
        return notificationRepository.findByUser_EmailOrderByCreatedAtDesc(email).stream()
                .map(NotificationServiceImpl::toDto)
                .toList();
    }

    @Override
    @Transactional
    public NotificationDto markAsRead(Long id, String email) {
        Notification notification =
                notificationRepository
                        .findByIdAndUser_Email(id, email)
                        .orElseThrow(() -> new NotFoundException("Notification not found"));
        notification.setReadStatus(true);
        return toDto(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllAsRead(String email) {
        List<Notification> notifications =
                notificationRepository.findByUser_EmailOrderByCreatedAtDesc(email);
        for (Notification notification : notifications) {
            if (!Boolean.TRUE.equals(notification.getReadStatus())) {
                notification.setReadStatus(true);
            }
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public NotificationDto createNotification(Long userId, String title, String message) {
        User user =
                userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReadStatus(false);
        return toDto(notificationRepository.save(notification));
    }

    private static NotificationDto toDto(Notification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getReadStatus(),
                notification.getCreatedAt());
    }
}
