package com.diploma.project.controller;

import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.service.AdminService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
