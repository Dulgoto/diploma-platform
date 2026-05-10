package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.Favorite;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.FavoriteRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.FavoriteService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class FavoriteServiceImpl implements FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final AdRepository adRepository;

    public FavoriteServiceImpl(
            FavoriteRepository favoriteRepository,
            UserRepository userRepository,
            AdRepository adRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.adRepository = adRepository;
    }

    @Override
    @Transactional
    public AdDto addFavorite(Long adId, String email) {
        User user =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        Ad ad = adRepository.findById(adId).orElseThrow(() -> new NotFoundException("Ad not found"));
        if (favoriteRepository.existsByUser_EmailAndAd_Id(email, adId)) {
            throw new BadRequestException("Ad is already in favorites");
        }
        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setAd(ad);
        favoriteRepository.save(favorite);
        return toAdDto(ad);
    }

    @Override
    @Transactional
    public void removeFavorite(Long adId, String email) {
        Favorite favorite =
                favoriteRepository
                        .findByUser_EmailAndAd_Id(email, adId)
                        .orElseThrow(() -> new NotFoundException("Favorite not found"));
        favoriteRepository.delete(favorite);
    }

    @Override
    public List<AdDto> getMyFavorites(String email) {
        return favoriteRepository.findByUser_EmailOrderByCreatedAtDesc(email).stream()
                .map(Favorite::getAd)
                .map(FavoriteServiceImpl::toAdDto)
                .toList();
    }

    @Override
    public boolean isFavorite(Long adId, String email) {
        return favoriteRepository.existsByUser_EmailAndAd_Id(email, adId);
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
        if (ad.getOwner() != null) {
            dto.setOwnerId(ad.getOwner().getId());
            dto.setOwnerName(ad.getOwner().getName());
        }
        dto.setCreatedAt(ad.getCreatedAt());
        return dto;
    }
}
