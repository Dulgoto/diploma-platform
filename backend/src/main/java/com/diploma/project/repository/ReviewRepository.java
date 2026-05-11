package com.diploma.project.repository;

import com.diploma.project.model.entity.Review;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByReviewedUser_IdOrderByCreatedAtDesc(Long reviewedUserId);

    Optional<Review> findByReviewer_EmailAndReviewedUser_Id(String email, Long reviewedUserId);

    boolean existsByReviewer_EmailAndReviewedUser_Id(String email, Long reviewedUserId);

    List<Review> findByReviewedUser_Id(Long reviewedUserId);
}
