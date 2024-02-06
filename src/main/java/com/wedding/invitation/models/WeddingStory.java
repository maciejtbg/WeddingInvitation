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
public class WeddingStory {
    public WeddingStory(String shortLoveStory, int weddingInvitedGuests, int weddingConfirmedGuests, int eventsDoneInThisPlace, int hoursSpentOnPreparing, UserAccount userAccount, List<Event> events, List<Guest> guests, List<Wish> wishes) {
        this.shortLoveStory = shortLoveStory;
        this.weddingInvitedGuests = weddingInvitedGuests;
        this.weddingConfirmedGuests = weddingConfirmedGuests;
        this.eventsDoneInThisPlace = eventsDoneInThisPlace;
        this.hoursSpentOnPreparing = hoursSpentOnPreparing;
        this.userAccount = userAccount;
        this.events = events;
        this.guests = guests;
        this.wishes = wishes;
    }

    public WeddingStory(String shortLoveStory, int weddingInvitedGuests, int weddingConfirmedGuests, int eventsDoneInThisPlace, int hoursSpentOnPreparing) {
        this.shortLoveStory = shortLoveStory;
        this.weddingInvitedGuests = weddingInvitedGuests;
        this.weddingConfirmedGuests = weddingConfirmedGuests;
        this.eventsDoneInThisPlace = eventsDoneInThisPlace;
        this.hoursSpentOnPreparing = hoursSpentOnPreparing;
    }

    @Id
    @GeneratedValue
    private long id;

    //history
    private String shortLoveStory;

    //wedding data
    private int weddingInvitedGuests;
    private int weddingConfirmedGuests;
    private int eventsDoneInThisPlace;
    private int hoursSpentOnPreparing;


    @OneToOne
    @JoinColumn(name = "user_account_id")
    private UserAccount userAccount;

    @OneToMany(mappedBy = "weddingStory", cascade = CascadeType.ALL)
    private List<Event> events;

    @OneToMany(mappedBy = "weddingStory", cascade = CascadeType.ALL)
    private List<Guest> guests;

    @OneToMany(mappedBy = "weddingStory", cascade = CascadeType.ALL)
    private List<Wish> wishes;

}
