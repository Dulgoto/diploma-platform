package com.diploma.project.service.impl;

import com.diploma.project.model.dto.AuthResponse;
import com.diploma.project.model.dto.LoginRequest;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserRegisterRequest;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AuthService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserPrivateDto register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setLocation(request.getLocation());
        user.setDescription(request.getDescription());
        user.setAvatarKey(request.getAvatarKey());
        User saved = userRepository.save(user);
        return toPrivateDto(saved);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }
        return new AuthResponse(null, user.getEmail(), user.getRole());
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
}
