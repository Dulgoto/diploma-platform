package com.diploma.project.service.impl;

import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.AdRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.AdService;
import org.springframework.stereotype.Service;

import java.util.List;

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