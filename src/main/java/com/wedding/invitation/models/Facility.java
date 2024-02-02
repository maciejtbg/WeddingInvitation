package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Facility {
    @Id
    @GeneratedValue
    private long id;
    private String name;
    private String iconUrl;
    @Column(columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "usr_id",nullable = false)
    private Usr usr;

    public Facility(String name, String iconUrl, String content, Usr usr) {
        this.name = name;
        this.iconUrl = iconUrl;
        this.content = content;
        this.usr = usr;
    }
}
