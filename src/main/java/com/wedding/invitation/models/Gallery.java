package com.wedding.invitation.models;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Entity
@NoArgsConstructor
@Setter
@Getter
public class Gallery {
    @Id
    @GeneratedValue
    private Long id;
    private String title;
    private String description;

    @ManyToOne
    @JoinColumn(name = "usr_id",nullable = false)
    private Usr usr;

    public Gallery(String title, String description, Usr usr) {
        this.title = title;
        this.description = description;
        this.usr = usr;
    }

    @OneToMany(mappedBy = "gallery")
    private List<Image> images;
}
