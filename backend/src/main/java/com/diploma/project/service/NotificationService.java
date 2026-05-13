package com.diploma.project.service;

import com.diploma.project.model.dto.NotificationDto;

import java.util.List;

public interface NotificationService {

    List<NotificationDto> getMyNotifications(String email);

    NotificationDto markAsRead(Long id, String email);

    void markAllAsRead(String email);

    NotificationDto createNotification(Long userId, String title, String message);
}
