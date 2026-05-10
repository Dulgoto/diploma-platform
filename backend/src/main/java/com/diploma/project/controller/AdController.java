package com.diploma.project.controller;

import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.AdType;
import com.diploma.project.service.AdService;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ads")
public class AdController {
    private final AdService adService;

    public AdController(AdService adService) {
        this.adService = adService;
    }

    @GetMapping
    public ResponseEntity<List<Ad>> getAllAds() {
        return ResponseEntity.ok(adService.getAllAds());
    }

    @GetMapping("/myAds")
    public ResponseEntity<List<Ad>> getMyAds(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(adService.getMyAds(email));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Ad>> searchAds(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) AdType type,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(
                adService.searchAds(keyword, category, type, location, minPrice, maxPrice, sort));
    }

    @GetMapping("/{id:\\d+}")
    public ResponseEntity<Ad> getAdById(@PathVariable Long id) {
        return ResponseEntity.ok(adService.getAdById(id));
    }

    @PostMapping
    public ResponseEntity<Ad> createAd(@RequestBody Ad ad, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.status(201).body(adService.createAd(ad, email));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ad> updateAd(
            @PathVariable Long id, @RequestBody Ad updatedAd, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(adService.updateAd(id, updatedAd, email));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        adService.deleteAd(id, email);
        return ResponseEntity.noContent().build();
    }
}