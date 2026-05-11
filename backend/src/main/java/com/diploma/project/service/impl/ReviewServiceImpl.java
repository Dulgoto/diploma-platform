package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.ReviewDto;
import com.diploma.project.model.dto.ReviewRequest;
import com.diploma.project.model.entity.Review;
import com.diploma.project.model.entity.User;
import com.diploma.project.repository.ReviewRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.ReviewService;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository, UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ReviewDto createReview(Long reviewedUserId, String reviewerEmail, ReviewRequest request) {
        validateRating(request.getRating());
        User reviewer =
                userRepository
                        .findByEmail(reviewerEmail)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        User reviewedUser =
                userRepository
                        .findById(reviewedUserId)
                        .orElseThrow(() -> new NotFoundException("User not found"));
        if (reviewer.getId().equals(reviewedUser.getId())) {
            throw new BadRequestException("You cannot review yourself");
        }
        if (reviewRepository.existsByReviewer_EmailAndReviewedUser_Id(reviewerEmail, reviewedUserId)) {
            throw new BadRequestException("Review already exists");
        }
        Review review = new Review();
        review.setReviewer(reviewer);
        review.setReviewedUser(reviewedUser);
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        Review saved = reviewRepository.save(review);
        recalculateAverageRating(reviewedUser);
        return toReviewDto(saved);
    }

    @Override
    @Transactional
    public ReviewDto updateReview(Long reviewedUserId, String reviewerEmail, ReviewRequest request) {
        validateRating(request.getRating());
        Review review =
                reviewRepository
                        .findByReviewer_EmailAndReviewedUser_Id(reviewerEmail, reviewedUserId)
                        .orElseThrow(() -> new NotFoundException("Review not found"));
        review.setRating(request.getRating());
        review.setComment(request.getComment());
        Review saved = reviewRepository.save(review);
        recalculateAverageRating(review.getReviewedUser());
        return toReviewDto(saved);
    }

    @Override
    public List<ReviewDto> getUserReviews(Long reviewedUserId) {
        if (!userRepository.existsById(reviewedUserId)) {
            throw new NotFoundException("User not found");
        }
        return reviewRepository.findByReviewedUser_IdOrderByCreatedAtDesc(reviewedUserId).stream()
                .map(ReviewServiceImpl::toReviewDto)
                .toList();
    }

    private static void validateRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 10) {
            throw new BadRequestException("Rating must be between 1 and 10");
        }
    }

    private void recalculateAverageRating(User reviewedUser) {
        List<Review> reviews = reviewRepository.findByReviewedUser_Id(reviewedUser.getId());
        if (reviews.isEmpty()) {
            reviewedUser.setAverageRating(0.0);
        } else {
            double sum = 0.0;
            for (Review r : reviews) {
                sum += r.getRating() / 2.0;
            }
            reviewedUser.setAverageRating(sum / reviews.size());
        }
        userRepository.save(reviewedUser);
    }

    private static ReviewDto toReviewDto(Review review) {
        User reviewer = review.getReviewer();
        User reviewedUser = review.getReviewedUser();
        return new ReviewDto(
                review.getId(),
                reviewer != null ? reviewer.getId() : null,
                reviewer != null ? reviewer.getName() : null,
                reviewer != null ? reviewer.getAvatarKey() : null,
                reviewedUser != null ? reviewedUser.getId() : null,
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                review.getUpdatedAt());
    }
}
