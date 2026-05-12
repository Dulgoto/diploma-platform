package com.diploma.project.model.dto;

import com.diploma.project.model.entity.AdType;
import java.time.LocalDateTime;
import java.util.List;

public class AdDto {

    private Long id;
    private String title;
    private String description;
    private Double price;
    private Double latitude;
    private Double longitude;
    private String location;
    private AdType type;
    private String category;
    private String keywords;
    private Long ownerId;
    private String ownerName;
    private LocalDateTime createdAt;
    private List<AdImageDto> images;

    public AdDto() {
    }

    public AdDto(String title, String description, Double price, Double latitude, Double longitude) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public AdDto(String title, String description, Double price, Double latitude, Double longitude,
                 AdType type, String category, String keywords, Long ownerId, String ownerName) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.latitude = latitude;
        this.longitude = longitude;
        this.type = type;
        this.category = category;
        this.keywords = keywords;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public AdType getType() {
        return type;
    }

    public void setType(AdType type) {
        this.type = type;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getKeywords() {
        return keywords;
    }

    public void setKeywords(String keywords) {
        this.keywords = keywords;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public List<AdImageDto> getImages() {
        return images;
    }

    public void setImages(List<AdImageDto> images) {
        this.images = images;
    }
}