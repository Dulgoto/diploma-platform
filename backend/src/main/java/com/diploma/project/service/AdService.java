package com.diploma.project.service;

import com.diploma.project.model.entity.Ad;
import java.util.List;

public interface AdService {

    List<Ad> getAllAds();

    Ad getAdById(Long id);

    Ad createAd(Ad ad);

    Ad updateAd(Long id, Ad updatedAd);

    void deleteAd(Long id);
}