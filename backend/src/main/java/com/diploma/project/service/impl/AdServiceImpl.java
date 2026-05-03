package com.diploma.project.service.impl;

import com.diploma.project.model.entity.Ad;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.service.AdService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AdServiceImpl implements AdService {

    private final AdRepository adRepository;

    public AdServiceImpl(AdRepository adRepository) {
        this.adRepository = adRepository;
    }

    @Override
    public List<Ad> getAllAds() {
        return adRepository.findAll();
    }

    @Override
    public Ad getAdById(Long id) {
        return adRepository.findById(id).orElse(null);
    }

    @Override
    public Ad createAd(Ad ad) {
        return adRepository.save(ad);
    }

    @Override
    public void deleteAd(Long id) {
        adRepository.deleteById(id);
    }
}