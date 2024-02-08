package com.wedding.invitation.controllers;

import com.wedding.invitation.dtos.GuestDto;
import com.wedding.invitation.dtos.UsrDto;
import com.wedding.invitation.models.Guest;
import com.wedding.invitation.services.GuestService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
