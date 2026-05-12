package com.diploma.project.model.dto;

import com.diploma.project.model.entity.Role;
import java.time.LocalDateTime;

public class UserPrivateDto {

    private Long id;
    private String email;
    private String name;
    private String location;
    private Double latitude;
    private Double longitude;
    private String description;
    private Double averageRating;
    private String avatarKey;
    private Role role;
    private LocalDateTime createdAt;

    public UserPrivateDto() {}

    public UserPrivateDto(Long id, String email, String name, String location, Double latitude,
            Double longitude, String description, Double averageRating, String avatarKey, Role role,
            LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.description = description;
        this.averageRating = averageRating;
        this.avatarKey = avatarKey;
        this.role = role;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public String getAvatarKey() {
        return avatarKey;
    }

    public void setAvatarKey(String avatarKey) {
        this.avatarKey = avatarKey;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
