package com.diploma.project.repository;

import com.diploma.project.model.entity.Ad;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdRepository extends JpaRepository<Ad, Long> {

    List<Ad> findByOwnerEmail(String email);
}