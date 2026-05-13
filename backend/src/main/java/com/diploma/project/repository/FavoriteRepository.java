package com.diploma.project.repository;

import com.diploma.project.model.entity.Favorite;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    boolean existsByUser_EmailAndAd_Id(String email, Long adId);

    Optional<Favorite> findByUser_EmailAndAd_Id(String email, Long adId);

    @EntityGraph(attributePaths = {"ad", "ad.owner", "ad.images"})
    List<Favorite> findByUser_EmailOrderByCreatedAtDesc(String email);
}
