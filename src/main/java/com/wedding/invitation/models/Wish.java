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
public class Wish {
    public Wish(String sender, String platform, String imageUrl, String content, WeddingStory weddingStory) {
        this.sender = sender;
        this.platform = platform;
        this.imageUrl = imageUrl;
        this.content = content;
        this.weddingStory = weddingStory;
    }

    public Wish(String sender, String platform, String imageUrl, String content) {
        this.sender = sender;
        this.platform = platform;
        this.imageUrl = imageUrl;
        this.content = content;
    }

    @Id
    @GeneratedValue
    private long id;
    private String sender;
    private String platform;
    private String imageUrl;
    private String content;

    @ManyToOne
    @JoinColumn(name = "wedding_story_id",nullable = false)
    private WeddingStory weddingStory;

}
