package com.wedding.invitation.services;


import com.wedding.invitation.models.Usr;
import com.wedding.invitation.repositories.UsrRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsrService {

    private final UsrRepository usrRepository;

    @Autowired
    public UsrService(UsrRepository usrRepository) {
        this.usrRepository = usrRepository;
    }


    public Optional<Usr> getUsrByAlias(String alias){
        System.out.println("Alias: "+alias);
        return usrRepository.findByAlias(alias);
    }

    public long getUserIdByAlias(String alias) throws UserNotFoundException {
        if (usrRepository.findByAlias(alias).isEmpty()) {
            throw new UserNotFoundException("User not found with alias: " + alias);
        }
        return usrRepository.findByAlias(alias).get().getId();
    }

    public Optional<Usr> getUsrById(long id){
        return usrRepository.findById(id);
    }


    public static class UserNotFoundException extends Exception {
        public UserNotFoundException(String message) {
            super(message);
        }
    }
}
