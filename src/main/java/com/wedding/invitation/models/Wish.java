package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor

public class Wish {
    @Id
    @GeneratedValue
    private long id;
    private String sender;
    private String platform;
    private String imageUrl;
    private String content;


    @ManyToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    public Wish(String sender, String platform, String imageUrl, String content,User user) {
        this.sender = sender;
        this.platform = platform;
        this.imageUrl = imageUrl;
        this.content = content;
        this.user = user;
    }

}
