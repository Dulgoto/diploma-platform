package com.diploma.project.service;

import com.diploma.project.model.dto.MessageDto;
import com.diploma.project.model.dto.MessageRequest;

import java.util.List;

public interface MessageService {

    MessageDto sendMessage(Long receiverId, String senderEmail, MessageRequest request);

    List<MessageDto> getChat(Long otherUserId, String currentUserEmail);

    List<MessageDto> getMyConversations(String currentUserEmail);
}
