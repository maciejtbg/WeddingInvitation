package com.wedding.invitation.models;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Guest {
    @Id
    @GeneratedValue
    private long id;

    //login and password
    private String guestName;
    private String questEmail;
    private String questPhone;

    @ManyToOne
    @JoinColumn(name = "usr_id", nullable = false)
    private Usr usr;

    public Guest(String guestName,
                 String questEmail,
                 String questPhone, Usr usr) {
        this.guestName = guestName;
        this.questEmail = questEmail;
        this.questPhone = questPhone;
        this.usr = usr;
    }
}
