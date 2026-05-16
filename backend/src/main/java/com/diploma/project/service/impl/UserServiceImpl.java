package com.diploma.project.service.impl;

import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.UserAvatarRequestDto;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserPublicDto;
import com.diploma.project.model.dto.UserUpdateRequest;
import com.diploma.project.model.entity.AvatarApprovalStatus;
import com.diploma.project.model.entity.User;
import com.diploma.project.model.entity.UserAvatarRequest;
import com.diploma.project.repository.UserAvatarRequestRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.UserService;
import com.diploma.project.validation.AvatarKeyValidation;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserAvatarRequestRepository userAvatarRequestRepository;

    public UserServiceImpl(
            UserRepository userRepository, UserAvatarRequestRepository userAvatarRequestRepository) {
        this.userRepository = userRepository;
        this.userAvatarRequestRepository = userAvatarRequestRepository;
    }

    @Override
    public UserPrivateDto getAccount(String email) {
        User user =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        return toPrivateDto(user);
    }

    @Override
    public UserPrivateDto updateAccount(String email, UserUpdateRequest request) {
        User user =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        user.setName(request.getName());
        user.setLocation(request.getLocation());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setDescription(request.getDescription());
        String requestedAvatarKey = request.getAvatarKey();
        AvatarKeyValidation.validateUserAvatarUpdate(requestedAvatarKey, user.getAvatarKey());
        user.setAvatarKey(
                requestedAvatarKey == null || requestedAvatarKey.isBlank() ? null : requestedAvatarKey);
        User saved = userRepository.save(user);
        return toPrivateDto(saved);
    }

    @Override
    public void deactivateAccount(String email) {
        User user =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        user.setActive(false);
        userRepository.save(user);
    }

    @Override
    public UserPublicDto getPublicProfile(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        return toPublicDto(user);
    }

    private UserPrivateDto toPrivateDto(User user) {
        var pendingAvatarRequest =
                userAvatarRequestRepository
                        .findFirstByUser_EmailAndStatusOrderByCreatedAtDesc(
                                user.getEmail(), AvatarApprovalStatus.PENDING_APPROVAL)
                        .map(request -> toPendingAvatarRequestDto(user, request))
                        .orElse(null);

        return new UserPrivateDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getLocation(),
                user.getLatitude(),
                user.getLongitude(),
                user.getDescription(),
                user.getAverageRating(),
                user.getAvatarKey(),
                user.getRole(),
                user.getActive(),
                user.getCreatedAt(),
                pendingAvatarRequest);
    }

    private static UserAvatarRequestDto toPendingAvatarRequestDto(
            User user, UserAvatarRequest request) {
        return new UserAvatarRequestDto(
                request.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getAvatarKey(),
                request.getImageKey(),
                request.getStatus(),
                request.getApprovalMessage(),
                request.getCreatedAt(),
                request.getReviewedAt());
    }

    private static UserPublicDto toPublicDto(User user) {
        return new UserPublicDto(
                user.getId(),
                user.getName(),
                user.getLocation(),
                user.getLatitude(),
                user.getLongitude(),
                user.getDescription(),
                user.getAverageRating(),
                user.getAvatarKey());
    }
}
