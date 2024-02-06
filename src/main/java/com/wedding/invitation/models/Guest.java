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
@AllArgsConstructor
public class Guest {
    public Guest(String guestName, String questEmail, String questPhone, WeddingStory weddingStory) {
        this.guestName = guestName;
        this.questEmail = questEmail;
        this.questPhone = questPhone;
        this.weddingStory = weddingStory;
    }

    public Guest(String guestName, String questEmail, String questPhone) {
        this.guestName = guestName;
        this.questEmail = questEmail;
        this.questPhone = questPhone;
    }

    @Id
    @GeneratedValue
    private long id;

    //login and password
    private String guestName;
    private String questEmail;
    private String questPhone;

    @ManyToOne
    @JoinColumn(name = "wedding_story_id",nullable = false)
    private WeddingStory weddingStory;
}
