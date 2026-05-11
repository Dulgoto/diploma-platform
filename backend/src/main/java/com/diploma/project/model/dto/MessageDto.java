package com.diploma.project.model.dto;

import java.time.LocalDateTime;

public class MessageDto {

    private Long id;
    private Long senderId;
    private String senderName;
    private String senderAvatarKey;
    private Long receiverId;
    private String receiverName;
    private String receiverAvatarKey;
    private String content;
    private Boolean readStatus;
    private LocalDateTime createdAt;

    public MessageDto() {}

    public MessageDto(
            Long id,
            Long senderId,
            String senderName,
            String senderAvatarKey,
            Long receiverId,
            String receiverName,
            String receiverAvatarKey,
            String content,
            Boolean readStatus,
            LocalDateTime createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderAvatarKey = senderAvatarKey;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.receiverAvatarKey = receiverAvatarKey;
        this.content = content;
        this.readStatus = readStatus;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getSenderAvatarKey() {
        return senderAvatarKey;
    }

    public void setSenderAvatarKey(String senderAvatarKey) {
        this.senderAvatarKey = senderAvatarKey;
    }

    public Long getReceiverId() {
        return receiverId;
    }

    public void setReceiverId(Long receiverId) {
        this.receiverId = receiverId;
    }

    public String getReceiverName() {
        return receiverName;
    }

    public void setReceiverName(String receiverName) {
        this.receiverName = receiverName;
    }

    public String getReceiverAvatarKey() {
        return receiverAvatarKey;
    }

    public void setReceiverAvatarKey(String receiverAvatarKey) {
        this.receiverAvatarKey = receiverAvatarKey;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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
