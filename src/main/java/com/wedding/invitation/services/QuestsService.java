package com.wedding.invitation.services;


import com.wedding.invitation.models.Guest;
import com.wedding.invitation.repositories.GuestsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class QuestsService {

    private final GuestsRepository guestsRepository;

    @Autowired
    public QuestsService(GuestsRepository guestsRepository) {
        this.guestsRepository = guestsRepository;
    }


    public Optional<Guest> getUserById(long id){
        return guestsRepository.findById(id);
    }

}
