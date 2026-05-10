package com.diploma.project.controller;

import com.diploma.project.model.dto.AdDto;
import com.diploma.project.service.FavoriteService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;

    public FavoriteController(FavoriteService favoriteService) {
        this.favoriteService = favoriteService;
    }

    @GetMapping
    public ResponseEntity<List<AdDto>> getMyFavorites(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(favoriteService.getMyFavorites(email));
    }

    @GetMapping("/{adId}/status")
    public ResponseEntity<Boolean> isFavorite(
            @PathVariable Long adId, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(favoriteService.isFavorite(adId, email));
    }

    @PostMapping("/{adId}")
    public ResponseEntity<AdDto> addFavorite(@PathVariable Long adId, Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.status(201).body(favoriteService.addFavorite(adId, email));
    }

    @DeleteMapping("/{adId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long adId, Authentication authentication) {
        String email = authentication.getName();
        favoriteService.removeFavorite(adId, email);
        return ResponseEntity.noContent().build();
    }
}
