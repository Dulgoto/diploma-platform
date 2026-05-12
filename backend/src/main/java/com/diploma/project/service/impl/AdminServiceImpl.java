package com.diploma.project.service.impl;

import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.Review;
import com.diploma.project.model.entity.Role;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.ReviewRepository;
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
    private final ReviewRepository reviewRepository;

    public AdminServiceImpl(
            UserRepository userRepository,
            AdRepository adRepository,
            ReviewRepository reviewRepository) {
        this.userRepository = userRepository;
        this.adRepository = adRepository;
        this.reviewRepository = reviewRepository;
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

    @Override
    public List<ReviewDto> getAllReviews(String adminEmail) {
        validateAdmin(adminEmail);
        return reviewRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(AdminServiceImpl::toReviewDto)
                .toList();
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewId, String adminEmail) {
        validateAdmin(adminEmail);
        Review review =
                reviewRepository
                        .findById(reviewId)
                        .orElseThrow(() -> new NotFoundException("Review not found"));
        User reviewedUser = review.getReviewedUser();
        reviewRepository.delete(review);
        if (reviewedUser != null) {
            recalculateAverageRating(reviewedUser);
        }
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

    private void recalculateAverageRating(User reviewedUser) {
        List<Review> reviews = reviewRepository.findByReviewedUser_Id(reviewedUser.getId());
        if (reviews.isEmpty()) {
            reviewedUser.setAverageRating(0.0);
        } else {
            double sum = 0.0;
            for (Review r : reviews) {
                sum += r.getRating() / 2.0;
            }
            reviewedUser.setAverageRating(sum / reviews.size());
        }
        userRepository.save(reviewedUser);
    }

    private static ReviewDto toReviewDto(Review review) {
        User reviewer = review.getReviewer();
        User reviewedUser = review.getReviewedUser();
        return new ReviewDto(
                review.getId(),
                reviewer != null ? reviewer.getId() : null,
                reviewer != null ? reviewer.getName() : null,
                reviewer != null ? reviewer.getAvatarKey() : null,
                reviewedUser != null ? reviewedUser.getId() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt());
    }
}
