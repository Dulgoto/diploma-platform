package com.diploma.project.controller;

import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.ReviewRequest;
import com.diploma.project.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/users/{userId}")
    public ResponseEntity<ReviewDto> createReview(
            @PathVariable Long userId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.status(201).body(reviewService.createReview(userId, email, request));
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<ReviewDto> updateReview(
            @PathVariable Long userId,
            @Valid @RequestBody ReviewRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(reviewService.updateReview(userId, email, request));
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<List<ReviewDto>> getUserReviews(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getUserReviews(userId));
    }
}
