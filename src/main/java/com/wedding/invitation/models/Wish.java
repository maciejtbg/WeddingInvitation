package com.wedding.invitation.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
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

    public Wish(String sender, String platform, String imageUrl, String content) {
        this.sender = sender;
        this.platform = platform;
        this.imageUrl = imageUrl;
        this.content = content;
    }

}
