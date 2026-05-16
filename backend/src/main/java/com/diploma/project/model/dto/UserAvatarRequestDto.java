package com.diploma.project.model.dto;

import com.diploma.project.model.entity.AvatarApprovalStatus;

import java.time.LocalDateTime;

public class UserAvatarRequestDto {

    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String currentAvatarKey;
    private String imageKey;
    private AvatarApprovalStatus status;
    private String approvalMessage;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    public UserAvatarRequestDto() {
    }

    public UserAvatarRequestDto(
            Long id,
            Long userId,
            String userName,
            String userEmail,
            String currentAvatarKey,
            String imageKey,
            AvatarApprovalStatus status,
            String approvalMessage,
            LocalDateTime createdAt,
            LocalDateTime reviewedAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.userEmail = userEmail;
        this.currentAvatarKey = currentAvatarKey;
        this.imageKey = imageKey;
        this.status = status;
        this.approvalMessage = approvalMessage;
        this.createdAt = createdAt;
        this.reviewedAt = reviewedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getCurrentAvatarKey() {
        return currentAvatarKey;
    }

    public void setCurrentAvatarKey(String currentAvatarKey) {
        this.currentAvatarKey = currentAvatarKey;
    }

    public String getImageKey() {
        return imageKey;
    }

    public void setImageKey(String imageKey) {
        this.imageKey = imageKey;
    }

    public AvatarApprovalStatus getStatus() {
        return status;
    }

    public void setStatus(AvatarApprovalStatus status) {
        this.status = status;
    }

    public String getApprovalMessage() {
        return approvalMessage;
    }

    public void setApprovalMessage(String approvalMessage) {
        this.approvalMessage = approvalMessage;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
