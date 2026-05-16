package com.diploma.project.controller;

import com.diploma.project.model.dto.AdApprovalUpdateRequest;
import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.AdStatusUpdateRequest;
import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserPrivateDto>> getAllUsers(Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(adminService.getAllUsers(adminEmail));
    }

    @PutMapping("/users/{id}/ban")
    public ResponseEntity<UserPrivateDto> banUser(
            @PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(adminService.banUser(id, adminEmail));
    }

    @PutMapping("/users/{id}/unban")
    public ResponseEntity<UserPrivateDto> unbanUser(
            @PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(adminService.unbanUser(id, adminEmail));
    }

    @GetMapping("/ads")
    public ResponseEntity<List<AdDto>> getAllAds(Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(adminService.getAllAds(adminEmail));
    }

    @PatchMapping("/ads/{id}/status")
    public ResponseEntity<AdDto> updateAdStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdStatusUpdateRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(adminService.updateAdStatus(id, request.getStatus(), adminEmail));
    }

    @PatchMapping("/ads/{id}/approval")
    public ResponseEntity<AdDto> updateAdApprovalStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdApprovalUpdateRequest request,
            Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(
                adminService.updateAdApprovalStatus(
                        id, request.getApprovalStatus(), request.getMessage(), adminEmail));
    }

    @DeleteMapping("/ads/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication.getName();
        adminService.deleteAd(id, adminEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/reviews")
    public ResponseEntity<List<ReviewDto>> getAllReviews(Authentication authentication) {
        String adminEmail = authentication.getName();
        return ResponseEntity.ok(adminService.getAllReviews(adminEmail));
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id, Authentication authentication) {
        String adminEmail = authentication.getName();
        adminService.deleteReview(id, adminEmail);
        return ResponseEntity.noContent().build();
    }
}
