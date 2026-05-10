package com.diploma.project.model.dto;

public class UserUpdateRequest {

    private String name;
    private String location;
    private String description;
    private String avatarKey;

    public UserUpdateRequest() {}

    public UserUpdateRequest(String name, String location, String description, String avatarKey) {
        this.name = name;
        this.location = location;
        this.description = description;
        this.avatarKey = avatarKey;
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

    public String getAvatarKey() {
        return avatarKey;
    }

    public void setAvatarKey(String avatarKey) {
        this.avatarKey = avatarKey;
    }
}
