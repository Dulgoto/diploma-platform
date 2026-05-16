package com.diploma.project.model.dto;

import com.diploma.project.model.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class UserRegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Pattern(
            regexp = "^(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$",
            message = "Password must be at least 8 characters and contain an uppercase letter, a digit, and a special character")
    private String password;

    @NotBlank
    private String confirmPassword;

    @NotBlank
    private String name;

    private String location;
    private Double latitude;
    private Double longitude;
    private String description;
    private String avatarKey;
    private Role role;

    public UserRegisterRequest() {
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
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
}
