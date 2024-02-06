package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class WeddingDetails {
    public WeddingDetails(Date ceremonyStartDate, Date ceremonyEndDate, Date weddingPartyStartDate, Date weddingPartyEndDate, String ceremonyLocation, String weddingLocation, String ceremonyDescription, String weddingPartyDescription, UserAccount userAccount, List<Facility> facilities) {
        this.ceremonyStartDate = ceremonyStartDate;
        this.ceremonyEndDate = ceremonyEndDate;
        this.weddingPartyStartDate = weddingPartyStartDate;
        this.weddingPartyEndDate = weddingPartyEndDate;
        this.ceremonyLocation = ceremonyLocation;
        this.weddingLocation = weddingLocation;
        this.ceremonyDescription = ceremonyDescription;
        this.weddingPartyDescription = weddingPartyDescription;
        this.userAccount = userAccount;
        this.facilities = facilities;
    }

    public WeddingDetails(Date ceremonyStartDate, Date ceremonyEndDate, Date weddingPartyStartDate, Date weddingPartyEndDate, String ceremonyLocation, String weddingLocation, String ceremonyDescription, String weddingPartyDescription) {
        this.ceremonyStartDate = ceremonyStartDate;
        this.ceremonyEndDate = ceremonyEndDate;
        this.weddingPartyStartDate = weddingPartyStartDate;
        this.weddingPartyEndDate = weddingPartyEndDate;
        this.ceremonyLocation = ceremonyLocation;
        this.weddingLocation = weddingLocation;
        this.ceremonyDescription = ceremonyDescription;
        this.weddingPartyDescription = weddingPartyDescription;
    }

    @Id
    @GeneratedValue
    private long id;
    //times
    private Date ceremonyStartDate;
    private Date ceremonyEndDate;
    private Date weddingPartyStartDate;
    private Date weddingPartyEndDate;
    //locations
    private String ceremonyLocation;
    private String weddingLocation;
    //descriptions
    private String ceremonyDescription;
    private String weddingPartyDescription;

    @OneToOne
    @JoinColumn(name = "user_account_id")
    private UserAccount userAccount;

    @OneToMany(mappedBy = "weddingDetails", cascade = CascadeType.ALL)
    private List<Facility> facilities;



}
