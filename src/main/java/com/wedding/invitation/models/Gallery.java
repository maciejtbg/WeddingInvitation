package com.wedding.invitation.models;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Gallery {

    public Gallery(String title, String description, WeddingMedia weddingMedia, List<Image> images) {
        this.title = title;
        this.description = description;
        this.weddingMedia = weddingMedia;
        this.images = images;
    }

    public Gallery(String title, String description) {
        this.title = title;
        this.description = description;
    }

    @Id
    @GeneratedValue
    private Long id;
    private String title;
    private String description;

    @ManyToOne
    @JoinColumn(name = "wedding_media_id")
    private WeddingMedia weddingMedia;

    @OneToMany(mappedBy = "gallery", cascade = CascadeType.ALL)
    private List<Image> images;


}
