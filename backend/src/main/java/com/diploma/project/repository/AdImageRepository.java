package com.diploma.project.repository;

import com.diploma.project.model.entity.AdImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdImageRepository extends JpaRepository<AdImage, Long> {

    List<AdImage> findByAd_IdOrderByOrderIndexAsc(Long adId);

    void deleteByAd_Id(Long adId);
}
