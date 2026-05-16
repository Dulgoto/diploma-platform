package com.diploma.project.model.dto;

import com.diploma.project.model.entity.AdStatus;
import jakarta.validation.constraints.NotNull;

public class AdStatusUpdateRequest {

    @NotNull
    private AdStatus status;

    public AdStatusUpdateRequest() {
    }

    public AdStatus getStatus() {
        return status;
    }

    public void setStatus(AdStatus status) {
        this.status = status;
    }
}
