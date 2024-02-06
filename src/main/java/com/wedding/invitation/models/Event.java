package com.wedding.invitation.models;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Event {

    public Event(String title, Date date, String imageUrl, String description, WeddingStory weddingStory) {
        this.title = title;
        this.date = date;
        this.imageUrl = imageUrl;
        this.description = description;
        this.weddingStory = weddingStory;
    }

    public Event(String title, Date date, String imageUrl, String description) {
        this.title = title;
        this.date = date;
        this.imageUrl = imageUrl;
        this.description = description;
    }

    @Id
    @GeneratedValue
    private long id;
    private String title;
    private Date date;



    private String imageUrl;
    private String description;

    @ManyToOne
    @JoinColumn(name = "wedding_story_id",nullable = false)
    private WeddingStory weddingStory;

}
