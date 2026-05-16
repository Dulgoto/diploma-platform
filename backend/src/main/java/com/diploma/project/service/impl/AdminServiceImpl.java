package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.AdImageDto;
import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.entity.*;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.ReviewRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdminService;
import com.diploma.project.service.NotificationService;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final UserRepository userRepository;
    private final AdRepository adRepository;
    private final ReviewRepository reviewRepository;
    private final NotificationService notificationService;

    public AdminServiceImpl(
            UserRepository userRepository,
            AdRepository adRepository,
            ReviewRepository reviewRepository,
            NotificationService notificationService) {
        this.userRepository = userRepository;
        this.adRepository = adRepository;
        this.reviewRepository = reviewRepository;
        this.notificationService = notificationService;
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
        User admin = requireAdmin(adminEmail);
        User user =
                userRepository.findById(userId).orElseThrow(() -> new NotFoundException("User not found"));
        if (Objects.equals(admin.getId(), user.getId())) {
            throw new BadRequestException("Admin cannot ban himself");
        }
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin users cannot be deactivated");
        }
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
    public AdDto updateAdStatus(Long adId, AdStatus status, String adminEmail) {
        validateAdmin(adminEmail);
        Ad ad = adRepository.findById(adId).orElseThrow(() -> new NotFoundException("Ad not found"));
        validateStatusForAdType(ad.getType(), status);
        ad.setStatus(status);
        return toAdDto(adRepository.save(ad));
    }

    @Override
    @Transactional
    public AdDto updateAdApprovalStatus(Long adId, ApprovalStatus approvalStatus, String adminEmail) {
        validateAdmin(adminEmail);
        if (approvalStatus == null) {
            throw new BadRequestException("Approval status is required");
        }
        Ad ad = adRepository.findById(adId).orElseThrow(() -> new NotFoundException("Ad not found"));
        ad.setApprovalStatus(approvalStatus);
        Ad saved = adRepository.save(ad);

        if (approvalStatus == ApprovalStatus.APPROVED || approvalStatus == ApprovalStatus.REJECTED) {
            User owner = saved.getOwner();
            if (owner != null) {
                String adTitle = saved.getTitle() != null ? saved.getTitle() : "Без заглавие";
                if (approvalStatus == ApprovalStatus.APPROVED) {
                    notificationService.createNotification(
                            owner.getId(),
                            "Обявата е одобрена",
                            "Обявата \"" + adTitle + "\" беше одобрена.");
                } else {
                    notificationService.createNotification(
                            owner.getId(),
                            "Обявата е отхвърлена",
                            "Обявата \"" + adTitle + "\" беше отхвърлена.");
                }
            }
        }

        return toAdDto(saved);
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

    private static void validateStatusForAdType(AdType type, AdStatus status) {
        if (status == null) {
            throw new BadRequestException("Ad status is required");
        }
        if (type == null) {
            throw new BadRequestException("Ad type is required");
        }

        if (type == AdType.SERVICE_REQUEST) {
            if (status != AdStatus.ACTIVE && status != AdStatus.COMPLETED) {
                throw new BadRequestException("Service request ads can only be active or completed");
            }
            return;
        }

        if (type == AdType.SERVICE_OFFER || type == AdType.PRODUCT_SALE) {
            if (status != AdStatus.ACTIVE && status != AdStatus.INACTIVE) {
                throw new BadRequestException(
                        "Service offer and product sale ads can only be active or inactive");
            }
            return;
        }

        throw new BadRequestException("Unsupported ad type");
    }

    private void validateAdmin(String email) {
        requireAdmin(email);
    }

    private User requireAdmin(String email) {
        User admin =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
        return admin;
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
        dto.setStatus(ad.getStatus());
        dto.setApprovalStatus(ad.getApprovalStatus());
        dto.setCreatedAt(ad.getCreatedAt());
        if (ad.getOwner() != null) {
            dto.setOwnerId(ad.getOwner().getId());
            dto.setOwnerName(ad.getOwner().getName());
        }
        List<AdImage> images = ad.getImages();
        if (images != null) {
            dto.setImages(
                    images.stream()
                            .sorted(
                                    Comparator.comparing(
                                            AdImage::getOrderIndex,
                                            Comparator.nullsLast(Comparator.naturalOrder())))
                            .map(
                                    img -> new AdImageDto(
                                            img.getId(),
                                            img.getImageKey(),
                                            img.getOriginalFileName(),
                                            img.getOrderIndex()))
                            .toList());
        } else {
            dto.setImages(List.of());
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
