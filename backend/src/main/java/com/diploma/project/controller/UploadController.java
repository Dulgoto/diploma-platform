package com.diploma.project.controller;

import com.diploma.project.model.dto.UploadResponse;
import com.diploma.project.model.dto.UserAvatarRequestDto;
import com.diploma.project.service.FileStorageService;
import com.diploma.project.service.UserAvatarRequestService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final FileStorageService fileStorageService;
    private final UserAvatarRequestService userAvatarRequestService;

    public UploadController(
            FileStorageService fileStorageService, UserAvatarRequestService userAvatarRequestService) {
        this.fileStorageService = fileStorageService;
        this.userAvatarRequestService = userAvatarRequestService;
    }

    @PostMapping("/ad-images")
    public ResponseEntity<UploadResponse> uploadAdImage(
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(fileStorageService.storeAdImage(file));
    }

    @PostMapping("/avatar")
    public ResponseEntity<UserAvatarRequestDto> uploadAvatar(
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userAvatarRequestService.createAvatarRequest(email, file));
    }
}
