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
    @JoinColumn(name = "usr_id",nullable = false)
    private Usr usr;

    public Wish(String sender, String platform, String imageUrl, String content,Usr usr) {
        this.sender = sender;
        this.platform = platform;
        this.imageUrl = imageUrl;
        this.content = content;
        this.usr = usr;
    }

}
