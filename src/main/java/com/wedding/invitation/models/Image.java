package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Image {
    public Image(String name, String imageUrl, Gallery gallery) {
        this.name = name;
        this.imageUrl = imageUrl;
        this.gallery = gallery;
    }

    public Image(String name, String imageUrl) {
        this.name = name;
        this.imageUrl = imageUrl;
    }

    @Id
    @GeneratedValue
    private Long id;
    private String name;




//    @Column(name = "Image", length = Integer.MAX_VALUE)
    private String imageUrl;

    @ManyToOne
    @JoinColumn(name = "gallery_id")
    private Gallery gallery;

}
