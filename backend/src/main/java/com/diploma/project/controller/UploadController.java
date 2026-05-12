package com.diploma.project.controller;

import com.diploma.project.model.dto.UploadResponse;
import com.diploma.project.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    private final FileStorageService fileStorageService;

    public UploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/ad-images")
    public ResponseEntity<UploadResponse> uploadAdImage(
            @RequestParam(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.status(201).body(fileStorageService.storeAdImage(file));
    }
}
