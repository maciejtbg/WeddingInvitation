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

    public Optional<Users> getUserById(long id){
        return usersRepository.findById(id);
    }
}
