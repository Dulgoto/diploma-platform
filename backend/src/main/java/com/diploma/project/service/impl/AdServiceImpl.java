package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.AdCreateRequest;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.AdImageDto;
import com.diploma.project.model.dto.AdUpdateRequest;
import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.AdImage;
import com.diploma.project.model.entity.AdStatus;
import com.diploma.project.model.entity.AdType;
import com.diploma.project.model.entity.ApprovalStatus;
import com.diploma.project.model.entity.Role;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdService;
import com.diploma.project.service.NotificationService;
import com.diploma.project.validation.AdCategoryValidation;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdServiceImpl implements AdService {

    private static final int MAX_IMAGES_PER_AD = 10;
    private static final String AD_IMAGES_PREFIX = "ad-images/";
    private static final Path UPLOADS_DIR = Paths.get("uploads");
    private static final Path AD_IMAGES_DIR = UPLOADS_DIR.resolve("ad-images").normalize();

    private final AdRepository adRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public AdServiceImpl(
            AdRepository adRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.adRepository = adRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @Override
    public List<AdDto> getAllAds() {
        return adRepository.findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus.APPROVED).stream()
                .map(AdServiceImpl::toAdDto)
                .toList();
    }

    @Override
    public List<AdDto> getMyAds(String email) {
        return adRepository.findByOwnerEmail(email).stream().map(AdServiceImpl::toAdDto).toList();
    }

    @Override
    public List<AdDto> searchAds(
            String keyword,
            String category,
            AdType type,
            String location,
            Double minPrice,
            Double maxPrice,
            String sort) {
        Specification<Ad> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (keyword != null && !keyword.isBlank()) {
                String pattern = "%" + keyword.toLowerCase().trim() + "%";
                predicates.add(
                        cb.or(
                                cb.like(cb.lower(root.get("title")), pattern),
                                cb.like(cb.lower(root.get("description")), pattern),
                                cb.like(cb.lower(root.get("keywords")), pattern)));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.toLowerCase().trim()));
            }
            if (location != null && !location.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase().trim() + "%"));
            }
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }
            predicates.add(cb.equal(root.get("approvalStatus"), ApprovalStatus.APPROVED));

            return cb.and(predicates.toArray(Predicate[]::new));
        };

        Sort order = resolveSort(sort);
        return adRepository.findAll(spec, order).stream().map(AdServiceImpl::toAdDto).toList();
    }

    private static Sort resolveSort(String sort) {
        if (sort == null || sort.isBlank()) {
            return Sort.by(Sort.Direction.DESC, "createdAt");
        }
        return switch (sort) {
            case "priceAsc" -> Sort.by(Sort.Direction.ASC, "price");
            case "priceDesc" -> Sort.by(Sort.Direction.DESC, "price");
            case "newest" -> Sort.by(Sort.Direction.DESC, "createdAt");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    @Override
    public AdDto getAdById(Long id, String email) {
        Ad ad = adRepository.findById(id).orElseThrow(() -> new NotFoundException("Ad not found"));
        if (ad.getApprovalStatus() == ApprovalStatus.APPROVED) {
            return toAdDto(ad);
        }
        if (email == null) {
            throw new NotFoundException("Ad not found");
        }
        User currentUser =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("Ad not found"));
        if (currentUser.getRole() == Role.ADMIN) {
            return toAdDto(ad);
        }
        if (ad.getOwner() != null && email.equals(ad.getOwner().getEmail())) {
            return toAdDto(ad);
        }
        throw new NotFoundException("Ad not found");
    }

    @Override
    @Transactional
    public AdDto createAd(AdCreateRequest request, String email) {
        validateImageKeys(request.getImageKeys());
        User owner =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        validateAdTypeForUserRole(request.getType(), owner.getRole());
        Ad ad = new Ad();
        ad.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        ad.setStatus(AdStatus.ACTIVE);
        ad.setTitle(request.getTitle());
        ad.setDescription(request.getDescription());
        ad.setPrice(request.getPrice());
        ad.setType(request.getType());
        AdCategoryValidation.validate(request.getCategory(), request.getType());
        ad.setCategory(request.getCategory().trim());
        ad.setKeywords(request.getKeywords());
        ad.setOwner(owner);
        ad.setLocation(owner.getLocation());
        ad.setLatitude(owner.getLatitude());
        ad.setLongitude(owner.getLongitude());
        replaceImages(ad, request.getImageKeys());
        Ad saved = adRepository.save(ad);
        notifyAdminsForPendingAd(saved, "Нова обява чака одобрение");
        return toAdDto(saved);
    }

    @Override
    @Transactional
    public AdDto updateAd(Long id, AdUpdateRequest request, String email) {
        validateImageKeys(request.getImageKeys());
        Ad existing =
                adRepository.findById(id).orElseThrow(() -> new NotFoundException("Ad not found"));
        if (existing.getOwner() == null || !existing.getOwner().getEmail().equals(email)) {
            throw new ForbiddenException("You are not the owner of this ad");
        }
        validateAdTypeForUserRole(request.getType(), existing.getOwner().getRole());
        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setPrice(request.getPrice());
        existing.setType(request.getType());
        if (!isStatusValidForAdType(request.getType(), existing.getStatus())) {
            existing.setStatus(AdStatus.ACTIVE);
        }
        AdCategoryValidation.validate(request.getCategory(), request.getType());
        existing.setCategory(request.getCategory().trim());
        existing.setKeywords(request.getKeywords());
        existing.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        replaceImages(existing, request.getImageKeys());
        Ad saved = adRepository.save(existing);
        notifyAdminsForPendingAd(saved, "Редактирана обява чака повторно одобрение");
        return toAdDto(saved);
    }

    @Override
    @Transactional
    public AdDto updateAdStatus(Long id, AdStatus status, String email) {
        Ad ad = adRepository.findById(id).orElseThrow(() -> new NotFoundException("Ad not found"));
        User currentUser =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));

        boolean isOwner = ad.getOwner() != null && ad.getOwner().getEmail().equals(email);
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("You are not allowed to update this ad status");
        }

        validateStatusForAdType(ad.getType(), status);

        ad.setStatus(status);
        return toAdDto(adRepository.save(ad));
    }

    @Override
    @Transactional
    public void deleteAd(Long id, String email) {
        Ad ad = adRepository.findById(id).orElseThrow(() -> new NotFoundException("Ad not found"));
        if (ad.getOwner() == null || !ad.getOwner().getEmail().equals(email)) {
            throw new ForbiddenException("You are not the owner of this ad");
        }
        adRepository.delete(ad);
    }

    private void notifyAdminsForPendingAd(Ad ad, String reason) {
        List<User> admins = userRepository.findByRoleAndActiveTrue(Role.ADMIN);
        String title = "Обява чака одобрение";
        String adTitle = ad.getTitle() != null ? ad.getTitle() : "Без заглавие";
        String message = reason + ": \"" + adTitle + "\"";
        for (User admin : admins) {
            notificationService.createNotification(admin.getId(), title, message);
        }
    }

    private static boolean isStatusValidForAdType(AdType type, AdStatus status) {
        if (type == null || status == null) {
            return false;
        }
        if (type == AdType.SERVICE_REQUEST) {
            return status == AdStatus.ACTIVE || status == AdStatus.COMPLETED;
        }
        if (type == AdType.SERVICE_OFFER || type == AdType.PRODUCT_SALE) {
            return status == AdStatus.ACTIVE || status == AdStatus.INACTIVE;
        }
        return false;
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

    private static void validateAdTypeForUserRole(AdType type, Role role) {
        if (type == null) {
            throw new BadRequestException("Ad type is required");
        }
        if (role == null) {
            throw new ForbiddenException("User role is missing");
        }
        if (role == Role.ADMIN) {
            return;
        }
        if (role == Role.CLIENT && type != AdType.SERVICE_REQUEST) {
            throw new BadRequestException("Clients can only create service request ads");
        }
        if (role == Role.SERVICE_PROVIDER
                && type != AdType.SERVICE_OFFER
                && type != AdType.PRODUCT_SALE) {
            throw new BadRequestException(
                    "Service providers can only create service offer or product sale ads");
        }
    }

    private static void validateImageKeys(List<String> imageKeys) {
        if (imageKeys == null || imageKeys.isEmpty()) {
            throw new BadRequestException("At least one image is required");
        }
        if (imageKeys.size() > MAX_IMAGES_PER_AD) {
            throw new BadRequestException("Maximum 10 images are allowed");
        }
        Path adImagesBase = AD_IMAGES_DIR.toAbsolutePath().normalize();
        for (String key : imageKeys) {
            if (key == null || key.isBlank()) {
                throw new BadRequestException("Image key cannot be blank");
            }
            if (key.indexOf('\\') >= 0) {
                throw new BadRequestException("Invalid image key");
            }
            if (key.contains("..")) {
                throw new BadRequestException("Invalid image key");
            }
            if (Paths.get(key).isAbsolute()) {
                throw new BadRequestException("Invalid image key");
            }
            if (!key.startsWith(AD_IMAGES_PREFIX)) {
                throw new BadRequestException("Invalid image key");
            }
            String relativePart = key.substring(AD_IMAGES_PREFIX.length());
            if (relativePart.isBlank()) {
                throw new BadRequestException("Invalid image key");
            }
            if (Paths.get(relativePart).isAbsolute()) {
                throw new BadRequestException("Invalid image key");
            }
            Path resolved = adImagesBase.resolve(relativePart).normalize();
            if (!resolved.startsWith(adImagesBase)) {
                throw new BadRequestException("Invalid image key");
            }
            if (!Files.isRegularFile(resolved)) {
                throw new BadRequestException("Image file not found");
            }
        }
    }

    private static void replaceImages(Ad ad, List<String> imageKeys) {
        ad.getImages().clear();
        for (int i = 0; i < imageKeys.size(); i++) {
            AdImage image = new AdImage();
            image.setImageKey(imageKeys.get(i));
            image.setOriginalFileName(null);
            image.setOrderIndex(i);
            image.setAd(ad);
            ad.getImages().add(image);
        }
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
        dto.setStatus(ad.getStatus());
        dto.setApprovalStatus(ad.getApprovalStatus());
        dto.setCategory(ad.getCategory());
        dto.setKeywords(ad.getKeywords());
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
}
