package com.wedding.invitation.services;


import com.wedding.invitation.dtos.GuestDto;
import com.wedding.invitation.models.Guest;
import com.wedding.invitation.repositories.GuestRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class GuestService {

    private final GuestRepository guestRepository;

    @Autowired
    public GuestService(GuestRepository guestRepository) {
        this.guestRepository = guestRepository;
    }


    public Optional<Guest> getUserById(long id) {
        return guestRepository.findById(id);
    }


    @Transactional
    public ResponseEntity<?> confirmGuestAttendance(GuestDto guestDto) {
        Optional<Guest> foundGuest = guestRepository.findByPhoneOrEmailOrName(guestDto.getGuestPhone(), guestDto.getGuestEmail(), guestDto.getGuestName());

        if (foundGuest.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Guest not found"));
        }

        Guest guest = foundGuest.get();
        guest.setConfirmed(true);
        guestRepository.save(guest);

        return ResponseEntity.ok().body(Map.of("message", "Guest confirmed"));
    }
}
