package com.wedding.invitation.models;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
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

    public Gallery(String title, String description) {
        this.title = title;
        this.description = description;
    }

    @OneToMany(mappedBy = "gallery")
    private List<Image> images;
}
