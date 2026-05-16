package com.diploma.project.model.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_avatar_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAvatarRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String imageKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AvatarApprovalStatus status = AvatarApprovalStatus.PENDING_APPROVAL;

    @Column(length = 1000)
    private String approvalMessage;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = AvatarApprovalStatus.PENDING_APPROVAL;
        }
    }
}
