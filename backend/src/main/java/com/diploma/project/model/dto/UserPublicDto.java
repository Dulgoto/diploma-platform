package com.diploma.project.model.dto;

public class UserPublicDto {

    private Long id;
    private String name;
    private String location;
    private String description;
    private Double averageRating;
    private String avatarKey;

    public UserPublicDto() {}

    public UserPublicDto(Long id, String name, String location, String description, Double averageRating,
            String avatarKey) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.description = description;
        this.averageRating = averageRating;
        this.avatarKey = avatarKey;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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
}
