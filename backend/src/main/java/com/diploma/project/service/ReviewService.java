package com.diploma.project.service;

import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.ReviewRequest;
import java.util.List;

public interface ReviewService {

    ReviewDto createReview(Long reviewedUserId, String reviewerEmail, ReviewRequest request);

    ReviewDto updateReview(Long reviewedUserId, String reviewerEmail, ReviewRequest request);

    List<ReviewDto> getUserReviews(Long reviewedUserId);
}
