package com.diploma.project.service;

import com.diploma.project.model.dto.UserPrivateDto;
import java.util.List;

public interface AdminService {

    List<UserPrivateDto> getAllUsers(String adminEmail);

    UserPrivateDto banUser(Long userId, String adminEmail);

    UserPrivateDto unbanUser(Long userId, String adminEmail);
}
