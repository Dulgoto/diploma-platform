package com.diploma.project.model.dto;

import java.time.LocalDateTime;

public class NotificationDto {

    private Long id;
    private String title;
    private String message;
    private Boolean readStatus;
    private LocalDateTime createdAt;

    public NotificationDto() {}

    public NotificationDto(
            Long id, String title, String message, Boolean readStatus, LocalDateTime createdAt) {
        this.id = id;
        this.title = title;
        this.message = message;
        this.readStatus = readStatus;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getReadStatus() {
        return readStatus;
    }

    public void setReadStatus(Boolean readStatus) {
        this.readStatus = readStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
