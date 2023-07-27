package com.wedding.invitation.models;


import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
public class Event {
    @Id
    private long id;
    private String title;
    private Date date;
    private String imageUrl;
    private String description;
}
