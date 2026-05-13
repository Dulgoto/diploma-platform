package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.model.dto.UploadResponse;
import com.diploma.project.service.FileStorageService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final String AD_IMAGES_SUBDIR = "ad-images";
    private static final Path AD_IMAGES_DIR = Paths.get("uploads", AD_IMAGES_SUBDIR);
    private static final long MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

    @Override
    public UploadResponse storeAdImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Image file is required");
        }
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BadRequestException("Image file size must be up to 10MB");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        String cleanedOriginalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = extractExtension(cleanedOriginalName);
        String storedFileName = UUID.randomUUID() + extension;

        try {
            Files.createDirectories(AD_IMAGES_DIR);
            Path targetPath = AD_IMAGES_DIR.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Failed to store image file");
        }

        String imageKey = AD_IMAGES_SUBDIR + "/" + storedFileName;
        return new UploadResponse(imageKey, cleanedOriginalName);
    }

    private static String extractExtension(String cleanedFileName) {
        if (cleanedFileName == null || cleanedFileName.isBlank()) {
            return "";
        }
        int dotIndex = cleanedFileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == cleanedFileName.length() - 1) {
            return "";
        }
        return cleanedFileName.substring(dotIndex);
    }
}
