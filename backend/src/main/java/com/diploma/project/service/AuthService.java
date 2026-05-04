package com.diploma.project.service;

import com.diploma.project.model.dto.AuthResponse;
import com.diploma.project.model.dto.LoginRequest;
import com.diploma.project.model.dto.UserPrivateDto;
import com.diploma.project.model.dto.UserRegisterRequest;

public interface AuthService {

    UserPrivateDto register(UserRegisterRequest request);

    AuthResponse login(LoginRequest request);
}
