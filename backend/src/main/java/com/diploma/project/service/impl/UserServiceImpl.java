package com.diploma.project.service.impl;

import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserPublicDto;
import com.diploma.project.model.dto.UserUpdateRequest;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.UserService;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
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
        user.setDescription(request.getDescription());
        user.setAvatarKey(request.getAvatarKey());
        User saved = userRepository.save(user);
        return toPrivateDto(saved);
    }

    @Override
    public UserPublicDto getPublicProfile(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new NotFoundException("User not found"));
        return toPublicDto(user);
    }

    private static UserPrivateDto toPrivateDto(User user) {
        return new UserPrivateDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getLocation(),
                user.getDescription(),
                user.getAverageRating(),
                user.getAvatarKey(),
                user.getRole(),
                user.getCreatedAt());
    }

    private static UserPublicDto toPublicDto(User user) {
        return new UserPublicDto(
                user.getId(),
                user.getName(),
                user.getLocation(),
                user.getDescription(),
                user.getAverageRating(),
                user.getAvatarKey());
    }
}
