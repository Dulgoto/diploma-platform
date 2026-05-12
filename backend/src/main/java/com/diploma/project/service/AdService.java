package com.diploma.project.service;

import com.diploma.project.model.dto.AdCreateRequest;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.AdUpdateRequest;
import com.diploma.project.model.entity.AdType;
import java.util.List;

public interface AdService {

    List<AdDto> getAllAds();

    List<AdDto> getMyAds(String email);

    List<AdDto> searchAds(
            String keyword,
            String category,
            AdType type,
            String location,
            Double minPrice,
            Double maxPrice,
            String sort);

    AdDto getAdById(Long id);

    AdDto createAd(AdCreateRequest request, String email);

    AdDto updateAd(Long id, AdUpdateRequest request, String email);

    void deleteAd(Long id, String email);
}
