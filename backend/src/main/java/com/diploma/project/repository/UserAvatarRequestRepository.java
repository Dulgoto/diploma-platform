package com.diploma.project.repository;

import com.diploma.project.model.entity.AvatarApprovalStatus;
import com.diploma.project.model.entity.UserAvatarRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAvatarRequestRepository extends JpaRepository<UserAvatarRequest, Long> {

    List<UserAvatarRequest> findAllByOrderByCreatedAtDesc();

    List<UserAvatarRequest> findByStatusOrderByCreatedAtDesc(AvatarApprovalStatus status);

    Optional<UserAvatarRequest> findFirstByUser_EmailAndStatusOrderByCreatedAtDesc(
            String email, AvatarApprovalStatus status);

    List<UserAvatarRequest> findByUser_EmailAndStatus(String email, AvatarApprovalStatus status);
}
