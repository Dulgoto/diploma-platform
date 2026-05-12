package com.diploma.project.service.impl;

import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.Role;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdminService;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final AdRepository adRepository;

    public AdminServiceImpl(UserRepository userRepository, AdRepository adRepository) {
        this.userRepository = userRepository;
        this.adRepository = adRepository;
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

    @Override
    public List<AdDto> getAllAds(String adminEmail) {
        validateAdmin(adminEmail);
        return adRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(AdminServiceImpl::toAdDto)
                .toList();
    }

    @Override
    @Transactional
    public void deleteAd(Long adId, String adminEmail) {
        validateAdmin(adminEmail);
        Ad ad = adRepository.findById(adId).orElseThrow(() -> new NotFoundException("Ad not found"));
        adRepository.delete(ad);
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

    private static AdDto toAdDto(Ad ad) {
        AdDto dto = new AdDto();
        dto.setId(ad.getId());
        dto.setTitle(ad.getTitle());
        dto.setDescription(ad.getDescription());
        dto.setPrice(ad.getPrice());
        dto.setLatitude(ad.getLatitude());
        dto.setLongitude(ad.getLongitude());
        dto.setLocation(ad.getLocation());
        dto.setType(ad.getType());
        dto.setCategory(ad.getCategory());
        dto.setKeywords(ad.getKeywords());
        dto.setCreatedAt(ad.getCreatedAt());
        if (ad.getOwner() != null) {
            dto.setOwnerId(ad.getOwner().getId());
            dto.setOwnerName(ad.getOwner().getName());
        }
        return dto;
    }
}
