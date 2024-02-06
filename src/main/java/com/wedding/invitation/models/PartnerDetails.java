package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PartnerDetails {

    public PartnerDetails(String firstName, String lastName, boolean gender, String phoneNumber, String description, UserAccount userAccount) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.phoneNumber = phoneNumber;
        this.description = description;
        this.userAccount = userAccount;
    }

    public PartnerDetails(String firstName, String lastName, boolean gender, String phoneNumber, String description) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.phoneNumber = phoneNumber;
        this.description = description;
    }

    @Id
    @GeneratedValue
    private long id;

    //personal data
    private String firstName;
    private String lastName;
    private boolean gender;
    private String phoneNumber;
    private String description;


    @ManyToOne
    @JoinColumn(name = "user_account_id")
    private UserAccount userAccount;

}
