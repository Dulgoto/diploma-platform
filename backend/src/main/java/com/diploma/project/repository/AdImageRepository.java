package com.diploma.project.repository;

import com.diploma.project.model.entity.AdImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AdImageRepository extends JpaRepository<AdImage, Long> {

    List<AdImage> findByAd_IdOrderByOrderIndexAsc(Long adId);

    void deleteByAd_Id(Long adId);
}
