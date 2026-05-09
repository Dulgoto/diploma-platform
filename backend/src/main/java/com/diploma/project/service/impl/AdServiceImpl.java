package com.diploma.project.service.impl;

import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.AdType;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdService;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class AdServiceImpl implements AdService {

    private final AdRepository adRepository;
    private final UserRepository userRepository;

    public AdServiceImpl(AdRepository adRepository, UserRepository userRepository) {
        this.adRepository = adRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<Ad> getAllAds() {
        return adRepository.findAll();
    }

    @Override
    public List<Ad> getMyAds(String email) {
        return adRepository.findByOwnerEmail(email);
    }

    @Override
    public List<Ad> searchAds(
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
        return adRepository.findAll(spec, order);
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
    public Ad getAdById(Long id) {
        return adRepository.findById(id).orElse(null);
    }

    @Override
    public Ad createAd(Ad ad, String email) {
        User owner = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        ad.setOwner(owner);
        ad.setLocation(owner.getLocation());
        return adRepository.save(ad);
    }

    @Override
    public Ad updateAd(Long id, Ad updatedAd, String email) {
        return adRepository
                .findById(id)
                .map(existing -> {
                    if (existing.getOwner() == null || !existing.getOwner().getEmail().equals(email)) {
                        throw new RuntimeException("You are not the owner of this ad");
                    }
                    existing.setTitle(updatedAd.getTitle());
                    existing.setDescription(updatedAd.getDescription());
                    existing.setPrice(updatedAd.getPrice());
                    existing.setType(updatedAd.getType());
                    existing.setCategory(updatedAd.getCategory());
                    existing.setKeywords(updatedAd.getKeywords());
                    return adRepository.save(existing);
                })
                .orElse(null);
    }

    @Override
    public void deleteAd(Long id, String email) {
        Ad ad = adRepository.findById(id).orElseThrow(() -> new RuntimeException("Ad not found"));
        if (ad.getOwner() == null || !ad.getOwner().getEmail().equals(email)) {
            throw new RuntimeException("You are not the owner of this ad");
        }
        adRepository.delete(ad);
    }
}