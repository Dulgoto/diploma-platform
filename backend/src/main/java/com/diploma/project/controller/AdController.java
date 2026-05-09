package com.diploma.project.controller;

import com.diploma.project.model.entity.Ad;
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
        Ad ad = adService.updateAd(id, updatedAd, email);
        if (ad == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ad);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id, Authentication authentication) {
        String email = authentication.getName();
        adService.deleteAd(id, email);
        return ResponseEntity.noContent().build();
    }
}