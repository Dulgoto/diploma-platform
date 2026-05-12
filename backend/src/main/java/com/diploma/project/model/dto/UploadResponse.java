package com.diploma.project.model.dto;

public class UploadResponse {

    private String imageKey;
    private String originalFileName;

    public UploadResponse() {}

    public UploadResponse(String imageKey, String originalFileName) {
        this.imageKey = imageKey;
        this.originalFileName = originalFileName;
    }

    public String getImageKey() {
        return imageKey;
    }

    public void setImageKey(String imageKey) {
        this.imageKey = imageKey;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }
}
