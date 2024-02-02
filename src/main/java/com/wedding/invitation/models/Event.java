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
    @JoinColumn(name = "usr_id",nullable = false)
    private Usr usr;

    public Event (String title, Date date, String imageUrl, String description, Usr usr){
        this.title = title;
        this.date = date;
        this.imageUrl = imageUrl;
        this.description = description;
        this.usr = usr;
    }
}
