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
public class Facility {
    @Id
    @GeneratedValue
    private long id;
    private String name;
    private String iconUrl;
    @Column(columnDefinition = "TEXT")
    private String content;

    public Facility(String name, String iconUrl, String content) {
        this.name = name;
        this.iconUrl = iconUrl;
        this.content = content;
    }

    @ManyToOne
    @JoinColumn(name = "wedding_details_id")
    private WeddingDetails weddingDetails;

    public Facility(String name, String iconUrl, String content, WeddingDetails weddingDetails) {
        this.name = name;
        this.iconUrl = iconUrl;
        this.content = content;
        this.weddingDetails = weddingDetails;
    }
}
