package com.diploma.project.validation;

import com.diploma.project.exception.BadRequestException;

import java.util.Set;

public final class AvatarKeyValidation {

    private static final Set<String> ALLOWED_AVATAR_KEYS =
            Set.of("avatar-1.png", "avatar-2.png", "avatar-3.png", "avatar-4.png", "avatar-5.png");

    private AvatarKeyValidation() {
    }

    public static void validate(String avatarKey) {
        if (avatarKey == null || avatarKey.isBlank()) {
            return;
        }
        if (!ALLOWED_AVATAR_KEYS.contains(avatarKey)) {
            throw new BadRequestException("Invalid avatar key");
        }
    }
}
