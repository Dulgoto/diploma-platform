package com.diploma.project.service;

import com.diploma.project.model.dto.AdDto;

import java.util.List;

public interface FavoriteService {

    AdDto addFavorite(Long adId, String email);

    void removeFavorite(Long adId, String email);

    List<AdDto> getMyFavorites(String email);

    boolean isFavorite(Long adId, String email);
}
