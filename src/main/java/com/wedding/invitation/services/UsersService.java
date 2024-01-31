package com.wedding.invitation.services;


import com.wedding.invitation.models.Users;
import com.wedding.invitation.repositories.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsersService {

    private final UsersRepository usersRepository;

    @Autowired
    public UsersService(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }


    public Optional<Users> getUserByAlias(String alias){
        System.out.println("Alias: "+alias);
        return usersRepository.findByAlias(alias);
    }

    public long getUserIdByAlias(String alias) throws UserNotFoundException {
        if (usersRepository.findByAlias(alias).isEmpty()) {
            throw new UserNotFoundException("User not found with alias: " + alias);
        }
        return usersRepository.findByAlias(alias).get().getId();
    }

    public Optional<Users> getUserById(long id){
        return usersRepository.findById(id);
    }


    public static class UserNotFoundException extends Exception {
        public UserNotFoundException(String message) {
            super(message);
        }
    }
}
