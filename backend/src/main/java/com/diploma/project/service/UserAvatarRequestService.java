package com.diploma.project.service;

import com.diploma.project.model.dto.UserAvatarRequestDto;
import com.diploma.project.model.entity.AvatarApprovalStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UserAvatarRequestService {

    UserAvatarRequestDto createAvatarRequest(String email, MultipartFile file);

    List<UserAvatarRequestDto> getAllRequests(String adminEmail);

    UserAvatarRequestDto updateStatus(
            Long requestId, AvatarApprovalStatus status, String message, String adminEmail);
}
