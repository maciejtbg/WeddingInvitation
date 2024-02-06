package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAccount {
    public UserAccount(String username, String password, String email, String alias, WeddingDetails weddingDetails, WeddingMedia weddingMedia, WeddingStory weddingStory, List<PartnerDetails> partnerDetails) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.alias = alias;
        this.weddingDetails = weddingDetails;
        this.weddingMedia = weddingMedia;
        this.weddingStory = weddingStory;
        this.partnerDetails = partnerDetails;
    }

    public UserAccount(String username, String password, String email, String alias) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.alias = alias;
    }

    @Id
    @GeneratedValue
    private long id;

    private String username;
    private String password;
    private String email;
    private String alias;


    @OneToOne(mappedBy = "userAccount", cascade = CascadeType.ALL)
    private WeddingDetails weddingDetails;

    @OneToOne(mappedBy = "userAccount", cascade = CascadeType.ALL)
    private WeddingMedia weddingMedia;

    @OneToOne(mappedBy = "userAccount", cascade = CascadeType.ALL)
    private WeddingStory weddingStory;

    @OneToMany(mappedBy = "userAccount", cascade = CascadeType.ALL)
    private List<PartnerDetails> partnerDetails;

//    UserAccount
//      PartnerDetails (ManyToOne)  dwóch partnerów do jednego konta
//      WeddingDetails (OneToOne)   jedne szczególy do jednego konta
//        Facility     (ManyToOne)  wiele udogodnień do jednych szczegółów
//      WeddingMedia   (OneToOne)   jedne media do jednego konta
//        Gallery      (ManyToOne)  wiele galerii do jednego konta
//          Image      (ManyToOne)  wiele zdjęć do jednej galerii
//      WeddingStory   (OneToOne)   jedna historia do jednego konta
//        Event        (ManyToOne)  wiele wydarzeń do jednej historii
//        Guest        (ManyToOne)  wiele gości do jednej historii
//        Wish         (ManyToOne)  wiele życzeń do jednej historii
//
}