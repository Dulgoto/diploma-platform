package com.diploma.project.model.dto;

import com.diploma.project.model.entity.AdType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

public class AdCreateRequest {

    @NotBlank
    private String title;
    private String description;
    @NotNull
    @PositiveOrZero
    private Double price;
    @NotNull
    private AdType type;
    private String category;
    private String keywords;
    private List<String> imageKeys;

    public AdCreateRequest() {
    }

    public AdCreateRequest(
            String title,
            String description,
            Double price,
            AdType type,
            String category,
            String keywords,
            List<String> imageKeys) {
        this.title = title;
        this.description = description;
        this.price = price;
        this.type = type;
        this.category = category;
        this.keywords = keywords;
        this.imageKeys = imageKeys;
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

    public List<String> getImageKeys() {
        return imageKeys;
    }

    public void setImageKeys(List<String> imageKeys) {
        this.imageKeys = imageKeys;
    }
}
