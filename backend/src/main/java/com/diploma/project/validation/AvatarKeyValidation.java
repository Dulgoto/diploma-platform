package com.diploma.project.validation;

import com.diploma.project.exception.BadRequestException;

import java.util.Set;

public final class AvatarKeyValidation {

    private static final Set<String> ALLOWED_PRESET_AVATAR_KEYS =
            Set.of("avatar-1.png", "avatar-2.png", "avatar-3.png", "avatar-4.png", "avatar-5.png");

    private AvatarKeyValidation() {
    }

    /** Validates preset avatar keys only (user account updates). */
    public static void validate(String avatarKey) {
        if (avatarKey == null || avatarKey.isBlank()) {
            return;
        }
        if (!ALLOWED_PRESET_AVATAR_KEYS.contains(avatarKey)) {
            throw new BadRequestException("Invalid avatar key");
        }
    }

    public static boolean isPresetAvatarKey(String avatarKey) {
        return avatarKey != null && ALLOWED_PRESET_AVATAR_KEYS.contains(avatarKey);
    }

    public static boolean isApprovedCustomAvatarKey(String avatarKey) {
        if (avatarKey == null || avatarKey.isBlank()) {
            return false;
        }
        if (avatarKey.contains("..")) {
            return false;
        }
        return avatarKey.startsWith("avatars/") && avatarKey.length() > "avatars/".length();
    }
    
    public static void validateUserAvatarUpdate(String requestedAvatarKey, String currentAvatarKey) {
        if (requestedAvatarKey == null || requestedAvatarKey.isBlank()) {
            return;
        }
        if (isPresetAvatarKey(requestedAvatarKey)) {
            return;
        }
        if (currentAvatarKey != null && currentAvatarKey.equals(requestedAvatarKey)) {
            return;
        }
        throw new BadRequestException("Invalid avatar key");
    }
}
