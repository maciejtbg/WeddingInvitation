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
public class Guests {
    @Id
    @GeneratedValue
    private long id;

    //login and password
    private String guestName;
    private String questEmail;
    private String questPhone;

    public Guests(String guestName,
                  String questEmail,
                  String questPhone) {
        this.guestName = guestName;
        this.questEmail = questEmail;
        this.questPhone = questPhone;
    }
}
