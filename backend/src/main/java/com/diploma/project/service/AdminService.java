package com.diploma.project.service;

import com.diploma.project.model.dto.AdDto;
import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.entity.AdStatus;
import com.diploma.project.model.entity.ApprovalStatus;

import java.util.List;

public interface AdminService {

    List<UserPrivateDto> getAllUsers(String adminEmail);

    UserPrivateDto banUser(Long userId, String adminEmail);

    UserPrivateDto unbanUser(Long userId, String adminEmail);

    List<AdDto> getAllAds(String adminEmail);

    AdDto updateAdStatus(Long adId, AdStatus status, String adminEmail);

    AdDto updateAdApprovalStatus(
            Long adId, ApprovalStatus approvalStatus, String message, String adminEmail);

    void deleteAd(Long adId, String adminEmail);

    List<ReviewDto> getAllReviews(String adminEmail);

    void deleteReview(Long reviewId, String adminEmail);
}
