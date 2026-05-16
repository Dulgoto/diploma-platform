package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.UnauthorizedException;
import com.diploma.project.model.dto.AuthResponse;
import com.diploma.project.model.dto.LoginRequest;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserRegisterRequest;
import com.diploma.project.model.entity.Role;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.security.JwtService;
import com.diploma.project.service.AuthService;
import com.diploma.project.validation.AvatarKeyValidation;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthServiceImpl(
            UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Override
    public UserPrivateDto register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Passwords do not match");
        }
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setName(request.getName());
        user.setLocation(request.getLocation());
        user.setLatitude(request.getLatitude());
        user.setLongitude(request.getLongitude());
        user.setDescription(request.getDescription());
        AvatarKeyValidation.validate(request.getAvatarKey());
        user.setAvatarKey(request.getAvatarKey());
        Role requestedRole = request.getRole();
        Role resolvedRole = requestedRole != null ? requestedRole : Role.CLIENT;
        if (resolvedRole == Role.ADMIN) {
            throw new BadRequestException("Cannot register as admin");
        }
        user.setRole(resolvedRole);
        User saved = userRepository.save(user);
        return toPrivateDto(saved);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository
                .findByEmail(request.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        if (Boolean.FALSE.equals(user.getActive())) {
            throw new ForbiddenException("User account is deactivated");
        }
        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getRole());
    }

    private static UserPrivateDto toPrivateDto(User user) {
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
                user.getCreatedAt());
    }
}
