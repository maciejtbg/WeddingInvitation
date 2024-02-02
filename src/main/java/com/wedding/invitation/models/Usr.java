package com.wedding.invitation.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Usr {
    @Id
    @GeneratedValue
    private long id;

    //login and password
    private String username;
    private String password;
    private String email;
    private String alias;
    //times
    private Date ceremonyStartDate;
    private Date ceremonyEndDate;
    private Date weddingPartyStartDate;
    private Date weddingPartyEndDate;
    //locations
    private String ceremonyLocation;
    private String weddingLocation;

    //personal data
    private String groomName;
    private String groomLastName;
    private String groomPhoneNumber;
    private String brideName;
    private String brideLastName;
    private String bridePhoneNumber;

    //descriptions
    private String groomDescription;
    private String brideDescription;
    private String ceremonyDescription;
    private String weddingPartyDescription;

    //history

    private String shortLoveStory;

    //wedding data
    private int weddingInvitedGuests;
    private int weddingConfirmedGuests;
    private int eventsDoneInThisPlace;
    private int hoursSpentOnPreparing;

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


    @OneToMany(mappedBy = "usr")
    private List<Gallery> galleries;
    @OneToMany(mappedBy = "usr")
    private List<Event> events;
    @OneToMany(mappedBy = "usr")
    private List<Facility> facilities;
    @OneToMany(mappedBy = "usr")
    private List<Guest> guests;
    @OneToMany(mappedBy = "usr")
    private List<Wish> wishes;

    public Usr(String username,
               String password,
               String email,
               String alias,
               Date ceremonyStartDate,
               Date ceremonyEndDate,
               Date weddingPartyStartDate,
               Date weddingPartyEndDate,
               String ceremonyLocation,
               String weddingLocation,
               String groomName,
               String groomLastName,
               String groomPhoneNumber,
               String brideName,
               String brideLastName,
               String bridePhoneNumber,
               String groomDescription,
               String brideDescription,
               String ceremonyDescription,
               String weddingPartyDescription,
               String shortLoveStory,
               int weddingInvitedGuests,
               int weddingConfirmedGuests,
               int eventsDoneInThisPlace,
               int hoursSpentOnPreparing,
               String backgroundTop,
               String groomImage,
               String brideImage,
               String backgroundMiddle,
               String backgroundNumbers,
               String backgroundBottom,
               String videoUrl,
               String videoThumbnail) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.alias = alias;
        this.ceremonyStartDate = ceremonyStartDate;
        this.ceremonyEndDate = ceremonyEndDate;
        this.weddingPartyStartDate = weddingPartyStartDate;
        this.weddingPartyEndDate = weddingPartyEndDate;
        this.ceremonyLocation = ceremonyLocation;
        this.weddingLocation = weddingLocation;
        this.groomName = groomName;
        this.groomLastName = groomLastName;
        this.groomPhoneNumber = groomPhoneNumber;
        this.brideName = brideName;
        this.brideLastName = brideLastName;
        this.bridePhoneNumber = bridePhoneNumber;
        this.groomDescription = groomDescription;
        this.brideDescription = brideDescription;
        this.ceremonyDescription = ceremonyDescription;
        this.weddingPartyDescription = weddingPartyDescription;
        this.shortLoveStory = shortLoveStory;
        this.weddingInvitedGuests = weddingInvitedGuests;
        this.weddingConfirmedGuests = weddingConfirmedGuests;
        this.eventsDoneInThisPlace = eventsDoneInThisPlace;
        this.hoursSpentOnPreparing = hoursSpentOnPreparing;
        this.backgroundTop = backgroundTop;
        this.groomImage = groomImage;
        this.brideImage = brideImage;
        this.backgroundMiddle = backgroundMiddle;
        this.backgroundNumbers = backgroundNumbers;
        this.backgroundBottom = backgroundBottom;
        this.videoUrl = videoUrl;
        this.videoThumbnail = videoThumbnail;
    }
}
