package com.diploma.project.validation;

import com.diploma.project.exception.BadRequestException;

import java.util.Set;

public final class AdCategoryValidation {

    private static final Set<String> ALLOWED_CATEGORIES =
            Set.of(
                    "Автомобили",
                    "Имоти",
                    "Електроника",
                    "Дом и градина",
                    "Мода",
                    "Работа",
                    "Услуги",
                    "Спорт и хоби",
                    "Животни",
                    "Други");

    private AdCategoryValidation() {
    }

    public static void validate(String category) {
        if (category == null || category.isBlank()) {
            throw new BadRequestException("Category is required");
        }
        String trimmed = category.trim();
        if (!ALLOWED_CATEGORIES.contains(trimmed)) {
            throw new BadRequestException("Invalid category");
        }
    }
}
