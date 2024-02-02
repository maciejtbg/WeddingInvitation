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
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Guest(String guestName,
                 String questEmail,
                 String questPhone, User user) {
        this.guestName = guestName;
        this.questEmail = questEmail;
        this.questPhone = questPhone;
        this.user = user;
    }
}
