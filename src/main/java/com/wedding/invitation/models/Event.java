package com.wedding.invitation.models;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
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


    public Event (String title, Date date, String imageUrl, String description){
        this.title = title;
        this.date = date;
        this.imageUrl = imageUrl;
        this.description = description;
    }
}
