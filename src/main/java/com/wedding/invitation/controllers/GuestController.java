package com.wedding.invitation.controllers;

import com.wedding.invitation.dtos.GuestDto;
import com.wedding.invitation.dtos.UsrDto;
import com.wedding.invitation.models.Guest;
import com.wedding.invitation.services.GuestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/guest")
public class GuestController {

    private final GuestService guestService;

    @Autowired
    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }

    @PostMapping("/confirm")
    public ResponseEntity<?> confirm(@Valid @RequestBody GuestDto guestDto){
        return  guestService.confirmGuestAttendance(guestDto);
    }
    @GetMapping("/list")
    public ResponseEntity<?> getListOfAllGuests(){
        return guestService.getListOfAllGuests();
    }

    @GetMapping("/list/confirmed")
    public ResponseEntity<?> getListOfConfirmedGuests(){
        return guestService.getListOfConfirmedGuests();
    }

    @GetMapping("/list/unconfirmed")
    public ResponseEntity<?> getListOfUnconfirmedGuests(){
        return guestService.getListOfUnconfirmedGuests();
    }
}
