package com.wedding.invitation.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    public Guest(String guestName, String guestEmail, String guestPhone, WeddingStory weddingStory) {
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.guestPhone = guestPhone;
        this.weddingStory = weddingStory;
    }

    public Guest(String guestName, String guestEmail, String guestPhone) {
        this.guestName = guestName;
        this.guestEmail = guestEmail;
        this.guestPhone = guestPhone;
    }

    @JsonIgnore
    @Id
    @GeneratedValue
    private long id;

    //login and password
    private String guestName;
    private String guestEmail;
    private String guestPhone;

    @JsonIgnore
    private boolean confirmed = false;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "wedding_story_id",nullable = false)
    private WeddingStory weddingStory;
}
