package com.diploma.project.service;

import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserPublicDto;
import com.diploma.project.model.dto.UserUpdateRequest;

public interface UserService {

    UserPrivateDto getAccount(String email);

    UserPrivateDto updateAccount(String email, UserUpdateRequest request);

    void deactivateAccount(String email);

    UserPublicDto getPublicProfile(Long id);
}
