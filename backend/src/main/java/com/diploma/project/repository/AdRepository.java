package com.diploma.project.repository;

import com.diploma.project.model.entity.Ad;
import com.diploma.project.model.entity.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface AdRepository extends JpaRepository<Ad, Long>, JpaSpecificationExecutor<Ad> {

    List<Ad> findByOwnerEmail(String email);

    List<Ad> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus approvalStatus);
}