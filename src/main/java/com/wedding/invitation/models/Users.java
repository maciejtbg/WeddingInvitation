package com.wedding.invitation.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Users {
    @Id
    @GeneratedValue
    private long id;

    //login and password
    private String username;
    private String password;
    private String email;
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

    //history

    private String shortLoveStory;

    //wedding data
    private String saveDateLink;
    private int weddingInvitedGuests;
    private int weddingConfirmedGuests;
    private int eventsDoneInThisPlace;
    private int hoursSpentOnPreparing;


    //video
    private String videoUrl;
    private String videoThumbnail;

    public Users(String username,
                 String password,
                 String email,
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
                 String shortLoveStory,
                 String saveDateLink,
                 int weddingInvitedGuests,
                 int weddingConfirmedGuests,
                 int eventsDoneInThisPlace,
                 int hoursSpentOnPreparing,
                 String videoUrl,
                 String videoThumbnail) {
        this.username = username;
        this.password = password;
        this.email = email;
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
        this.shortLoveStory = shortLoveStory;
        this.saveDateLink = saveDateLink;
        this.weddingInvitedGuests = weddingInvitedGuests;
        this.weddingConfirmedGuests = weddingConfirmedGuests;
        this.eventsDoneInThisPlace = eventsDoneInThisPlace;
        this.hoursSpentOnPreparing = hoursSpentOnPreparing;
        this.videoUrl = videoUrl;
        this.videoThumbnail = videoThumbnail;
    }
}
