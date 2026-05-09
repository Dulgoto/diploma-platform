package com.diploma.project.service;

import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.AdType;
import java.util.List;

public interface AdService {

    List<Ad> getAllAds();

    List<Ad> getMyAds(String email);

    List<Ad> searchAds(
            String keyword,
            String category,
            AdType type,
            String location,
            Double minPrice,
            Double maxPrice,
            String sort);

    Ad getAdById(Long id);

    Ad createAd(Ad ad, String email);

    Ad updateAd(Long id, Ad updatedAd, String email);

    void deleteAd(Long id, String email);
}