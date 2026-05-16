package com.diploma.project.service.impl;

import com.diploma.project.exception.BadRequestException;
import com.diploma.project.exception.ForbiddenException;
import com.diploma.project.exception.NotFoundException;
import com.diploma.project.model.dto.UploadResponse;
import com.diploma.project.model.dto.UserAvatarRequestDto;
import com.diploma.project.model.entity.AvatarApprovalStatus;
import com.diploma.project.model.entity.Role;
import com.diploma.project.model.entity.User;
import com.diploma.project.model.entity.UserAvatarRequest;
import com.diploma.project.repository.UserAvatarRequestRepository;
import com.diploma.project.repository.UserRepository;
import com.diploma.project.service.FileStorageService;
import com.diploma.project.service.NotificationService;
import com.diploma.project.service.UserAvatarRequestService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class UserAvatarRequestServiceImpl implements UserAvatarRequestService {

    private static final String REPLACED_PENDING_MESSAGE = "Заменена от нова заявка за аватар.";

    private final UserAvatarRequestRepository userAvatarRequestRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;

    public UserAvatarRequestServiceImpl(
            UserAvatarRequestRepository userAvatarRequestRepository,
            UserRepository userRepository,
            FileStorageService fileStorageService,
            NotificationService notificationService) {
        this.userAvatarRequestRepository = userAvatarRequestRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public UserAvatarRequestDto createAvatarRequest(String email, MultipartFile file) {
        User user =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));

        UploadResponse upload = fileStorageService.storeAvatarImage(file);
        rejectPendingRequestsWithoutNotification(user, REPLACED_PENDING_MESSAGE);

        UserAvatarRequest request = new UserAvatarRequest();
        request.setUser(user);
        request.setImageKey(upload.getImageKey());
        request.setStatus(AvatarApprovalStatus.PENDING_APPROVAL);
        UserAvatarRequest saved = userAvatarRequestRepository.save(request);

        notifyAdminsForPendingAvatar(user);

        return toDto(saved);
    }

    @Override
    public List<UserAvatarRequestDto> getAllRequests(String adminEmail) {
        validateAdmin(adminEmail);
        return userAvatarRequestRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(UserAvatarRequestServiceImpl::toDto)
                .toList();
    }

    @Override
    @Transactional
    public UserAvatarRequestDto updateStatus(
            Long requestId, AvatarApprovalStatus status, String message, String adminEmail) {
        validateAdmin(adminEmail);
        if (status == null) {
            throw new BadRequestException("Approval status is required");
        }

        UserAvatarRequest request =
                userAvatarRequestRepository
                        .findById(requestId)
                        .orElseThrow(() -> new NotFoundException("Avatar request not found"));

        request.setStatus(status);

        if (status == AvatarApprovalStatus.PENDING_APPROVAL) {
            request.setReviewedAt(null);
            request.setApprovalMessage(null);
        } else {
            request.setReviewedAt(LocalDateTime.now());
        }

        if (status == AvatarApprovalStatus.APPROVED) {
            request.setApprovalMessage(null);
            User owner = request.getUser();
            if (owner != null) {
                owner.setAvatarKey(request.getImageKey());
                userRepository.save(owner);
            }
        } else if (status == AvatarApprovalStatus.REJECTED) {
            String fallback = "Аватарът не беше одобрен. Моля, качете друга снимка.";
            String finalMessage =
                    message != null && !message.isBlank() ? message.trim() : fallback;
            request.setApprovalMessage(finalMessage);

            User owner = request.getUser();
            if (owner != null) {
                notificationService.createNotification(
                        owner.getId(),
                        "Аватарът е отхвърлен",
                        request.getApprovalMessage());
            }
        }

        UserAvatarRequest saved = userAvatarRequestRepository.save(request);
        return toDto(saved);
    }

    private void rejectPendingRequestsWithoutNotification(User user, String approvalMessage) {
        List<UserAvatarRequest> pending =
                userAvatarRequestRepository.findByUser_EmailAndStatus(
                        user.getEmail(), AvatarApprovalStatus.PENDING_APPROVAL);
        if (pending.isEmpty()) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        for (UserAvatarRequest old : pending) {
            old.setStatus(AvatarApprovalStatus.REJECTED);
            old.setApprovalMessage(approvalMessage);
            old.setReviewedAt(now);
        }
        userAvatarRequestRepository.saveAll(pending);
    }

    private void notifyAdminsForPendingAvatar(User user) {
        List<User> admins = userRepository.findByRoleAndActiveTrue(Role.ADMIN);
        String userName = user.getName() != null ? user.getName() : "Потребител";
        String title = "Аватар чака одобрение";
        String notificationMessage =
                "Потребителят " + userName + " качи нов аватар за одобрение.";
        for (User admin : admins) {
            notificationService.createNotification(admin.getId(), title, notificationMessage);
        }
    }

    private void validateAdmin(String email) {
        User admin =
                userRepository.findByEmail(email).orElseThrow(() -> new NotFoundException("User not found"));
        if (admin.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Admin access required");
        }
    }

    static UserAvatarRequestDto toDto(UserAvatarRequest request) {
        User user = request.getUser();
        return new UserAvatarRequestDto(
                request.getId(),
                user != null ? user.getId() : null,
                user != null ? user.getName() : null,
                user != null ? user.getEmail() : null,
                user != null ? user.getAvatarKey() : null,
                request.getImageKey(),
                request.getStatus(),
                request.getApprovalMessage(),
                request.getCreatedAt(),
                request.getReviewedAt());
    }
}
