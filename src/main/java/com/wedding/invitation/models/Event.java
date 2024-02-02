package com.wedding.invitation.models;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Event {
    @Id
    @GeneratedValue
    private long id;
    private String title;
    private Date date;
    private String imageUrl;
    private String description;

    @ManyToOne
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    public Event (String title, Date date, String imageUrl, String description, User user){
        this.title = title;
        this.date = date;
        this.imageUrl = imageUrl;
        this.description = description;
        this.user = user;
    }
}
