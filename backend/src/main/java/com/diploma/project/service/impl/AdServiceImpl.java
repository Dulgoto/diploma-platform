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
import com.diploma.project.model.entity.AdType;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdService;
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

    public AdServiceImpl(AdRepository adRepository, UserRepository userRepository) {
        this.adRepository = adRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<AdDto> getAllAds() {
        return adRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
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

            if (predicates.isEmpty()) {
                return cb.conjunction();
            }
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
    public AdDto getAdById(Long id) {
        Ad ad = adRepository.findById(id).orElseThrow(() -> new NotFoundException("Ad not found"));
        return toAdDto(ad);
    }

    @Override
    @Transactional
    public AdDto createAd(AdCreateRequest request, String email) {
        validateImageKeys(request.getImageKeys());
        User owner =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        Ad ad = new Ad();
        ad.setTitle(request.getTitle());
        ad.setDescription(request.getDescription());
        ad.setPrice(request.getPrice());
        ad.setType(request.getType());
        ad.setCategory(request.getCategory());
        ad.setKeywords(request.getKeywords());
        ad.setOwner(owner);
        ad.setLocation(owner.getLocation());
        ad.setLatitude(owner.getLatitude());
        ad.setLongitude(owner.getLongitude());
        replaceImages(ad, request.getImageKeys());
        Ad saved = adRepository.save(ad);
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
        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setPrice(request.getPrice());
        existing.setType(request.getType());
        existing.setCategory(request.getCategory());
        existing.setKeywords(request.getKeywords());
        replaceImages(existing, request.getImageKeys());
        Ad saved = adRepository.save(existing);
        return toAdDto(saved);
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
