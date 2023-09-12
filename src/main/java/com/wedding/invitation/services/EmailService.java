package com.wedding.invitation.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.repository.query.Param;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class EmailService {

    @Autowired
    private JavaMailSender javaMailSender;

    @PostMapping("/send-email")
    public void sendEmail(
            @RequestParam(value = "receiver") String receiver,
            @RequestParam(value = "title") String title,
            @RequestParam(value = "content") String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(receiver);
        message.setSubject(title);
        message.setText(content);

        javaMailSender.send(message);
    }

}
