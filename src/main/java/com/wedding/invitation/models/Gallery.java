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
    @JoinColumn(name = "user_id",nullable = false)
    private User user;

    public Gallery(String title, String description, User user) {
        this.title = title;
        this.description = description;
        this.user = user;
    }

    @OneToMany(mappedBy = "gallery")
    private List<Image> images;
}
