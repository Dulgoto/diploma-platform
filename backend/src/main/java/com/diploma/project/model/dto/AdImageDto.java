package com.diploma.project.model.dto;

public class AdImageDto {

    private Long id;
    private String imageKey;
    private String originalFileName;
    private Integer orderIndex;

    public AdImageDto() {}

    public AdImageDto(Long id, String imageKey, String originalFileName, Integer orderIndex) {
        this.id = id;
        this.imageKey = imageKey;
        this.originalFileName = originalFileName;
        this.orderIndex = orderIndex;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
}
