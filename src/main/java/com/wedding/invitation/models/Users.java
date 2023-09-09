package com.wedding.invitation.models;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

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
    private Date ceremontStartDate;
    private Date ceremontEndDate;
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

    private String groomDescription;
    private String brideDescription;
    private String saveDateLink;
    private String shortLoveStory;
    private String eventList;
    private String weddingInvitedGuests;
    private String weddingConfirmedGuests;
    private String eventsDoneInThisPlace;
    private String hoursSpentOnPreparing;
    private String wishList;
    private String facilityList;
    private String videoUrl;
    private String videoThumbnail;
    private String imageList;
    private String galleryList;


}
