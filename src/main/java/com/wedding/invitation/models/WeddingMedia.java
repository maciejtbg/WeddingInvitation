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
public class WeddingMedia {
    public WeddingMedia(String backgroundTop, String groomImage, String brideImage, String backgroundMiddle, String backgroundNumbers, String backgroundBottom, String videoUrl, String videoThumbnail, UserAccount userAccount, List<Gallery> galleries) {
        this.backgroundTop = backgroundTop;
        this.groomImage = groomImage;
        this.brideImage = brideImage;
        this.backgroundMiddle = backgroundMiddle;
        this.backgroundNumbers = backgroundNumbers;
        this.backgroundBottom = backgroundBottom;
        this.videoUrl = videoUrl;
        this.videoThumbnail = videoThumbnail;
        this.userAccount = userAccount;
        this.galleries = galleries;
    }

    public WeddingMedia(String backgroundTop, String groomImage, String brideImage, String backgroundMiddle, String backgroundNumbers, String backgroundBottom, String videoUrl, String videoThumbnail) {
        this.backgroundTop = backgroundTop;
        this.groomImage = groomImage;
        this.brideImage = brideImage;
        this.backgroundMiddle = backgroundMiddle;
        this.backgroundNumbers = backgroundNumbers;
        this.backgroundBottom = backgroundBottom;
        this.videoUrl = videoUrl;
        this.videoThumbnail = videoThumbnail;
    }

    @Id
    @GeneratedValue
    private long id;

    //images
    private String backgroundTop;
    private String groomImage;
    private String brideImage;
    private String backgroundMiddle;
    private String backgroundNumbers;
    private String backgroundBottom;

    //video
    private String videoUrl;
    private String videoThumbnail;

    @OneToOne
    @JoinColumn(name = "user_account_id")
    private UserAccount userAccount;

    @OneToMany(mappedBy = "weddingMedia", cascade = CascadeType.ALL)
    private List<Gallery> galleries;

}
