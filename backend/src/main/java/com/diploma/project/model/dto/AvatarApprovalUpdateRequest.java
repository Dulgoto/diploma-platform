package com.diploma.project.model.dto;

import com.diploma.project.model.entity.AvatarApprovalStatus;
import jakarta.validation.constraints.NotNull;

public class AvatarApprovalUpdateRequest {

    @NotNull
    private AvatarApprovalStatus status;

    private String message;

    public AvatarApprovalStatus getStatus() {
        return status;
    }

    public void setStatus(AvatarApprovalStatus status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
