package com.diploma.project.service;

import com.diploma.project.model.dto.UploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    UploadResponse storeAdImage(MultipartFile file);
}
