package com.diploma.project.validation;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.model.entity.AdType;

import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

public final class AdCategoryValidation {

    private static final Set<String> SERVICE_CATEGORIES =
            Set.of(
                    "Ремонтни услуги",
                    "ВиК услуги",
                    "Електроуслуги",
                    "Строителни услуги",
                    "Почистване",
                    "Транспорт",
                    "Градинарство",
                    "Уроци и обучение",
                    "IT услуги",
                    "Други услуги");

    private static final Set<String> PRODUCT_CATEGORIES =
            Set.of(
                    "Инструменти",
                    "Строителни материали",
                    "Електроника",
                    "Дом и градина",
                    "Мебели",
                    "Авточасти",
                    "Дрехи и аксесоари",
                    "Други стоки");

    private static final Set<String> ALLOWED_CATEGORIES =
            Stream.concat(SERVICE_CATEGORIES.stream(), PRODUCT_CATEGORIES.stream())
                    .collect(Collectors.toUnmodifiableSet());

    private AdCategoryValidation() {
    }

    public static void validate(String category, AdType type) {
        if (category == null || category.isBlank()) {
            throw new BadRequestException("Category is required");
        }
        if (type == null) {
            throw new BadRequestException("Ad type is required");
        }
        String trimmed = category.trim();
        if (type == AdType.PRODUCT_SALE) {
            if (!PRODUCT_CATEGORIES.contains(trimmed)) {
                throw new BadRequestException("Invalid category");
            }
            return;
        }
        if (type == AdType.SERVICE_REQUEST || type == AdType.SERVICE_OFFER) {
            if (!SERVICE_CATEGORIES.contains(trimmed)) {
                throw new BadRequestException("Invalid category");
            }
            return;
        }
        throw new BadRequestException("Invalid category");
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
