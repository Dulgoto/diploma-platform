package com.diploma.project.controller;

import com.diploma.project.model.dto.AdDto;
import com.diploma.project.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return ResponseEntity.status(HttpStatus.CREATED).body(favoriteService.addFavorite(adId, email));
    }

    @DeleteMapping("/{adId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long adId, Authentication authentication) {
        String email = authentication.getName();
        favoriteService.removeFavorite(adId, email);
        return ResponseEntity.noContent().build();
    }
}
