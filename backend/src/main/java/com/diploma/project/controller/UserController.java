package com.diploma.project.controller;

import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserPublicDto;
import com.diploma.project.model.dto.UserUpdateRequest;
import com.diploma.project.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/account")
    public ResponseEntity<UserPrivateDto> getAccount(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.getAccount(email));
    }

    @PutMapping("/account")
    public ResponseEntity<UserPrivateDto> updateAccount(
            Authentication authentication, @RequestBody UserUpdateRequest request) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateAccount(email, request));
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deactivateAccount(Authentication authentication) {
        String email = authentication.getName();
        userService.deactivateAccount(email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserPublicDto> getPublicProfile(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getPublicProfile(id));
    }
}
