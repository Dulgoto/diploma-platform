package com.diploma.project.model.dto;

import com.diploma.project.model.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;

public class AdApprovalUpdateRequest {

    @NotNull
    private ApprovalStatus approvalStatus;

    private String message;

    public ApprovalStatus getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(ApprovalStatus approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
