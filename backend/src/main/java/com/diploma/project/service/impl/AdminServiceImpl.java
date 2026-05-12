package com.diploma.project.service.impl;

import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.entity.Role;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdminService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;

    public AdminServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public List<UserPrivateDto> getAllUsers(String adminEmail) {
        validateAdmin(adminEmail);
        return userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminServiceImpl::toPrivateDto)
                .toList();
    }

    @Override
    @Transactional
    public UserPrivateDto banUser(Long userId, String adminEmail) {
        validateAdmin(adminEmail);
        User user =
                userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        user.setActive(false);
        return toPrivateDto(userRepository.save(user));
    }

    @Override
    @Transactional
    public UserPrivateDto unbanUser(Long userId, String adminEmail) {
        validateAdmin(adminEmail);
        User user =
                userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        user.setActive(true);
        return toPrivateDto(userRepository.save(user));
    }

    private void validateAdmin(String email) {
        User admin =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
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
