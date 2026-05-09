package com.diploma.project.service;

import com.diploma.project.model.entity.Ad;
import java.util.List;

public interface AdService {

    List<Ad> getAllAds();

    List<Ad> getMyAds(String email);

    Ad getAdById(Long id);

    Ad createAd(Ad ad, String email);

    Ad updateAd(Long id, Ad updatedAd, String email);

    void deleteAd(Long id, String email);
}