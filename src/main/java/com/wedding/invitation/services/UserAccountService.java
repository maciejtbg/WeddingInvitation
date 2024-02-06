package com.wedding.invitation.services;


import com.wedding.invitation.models.UserAccount;
import com.wedding.invitation.repositories.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserAccountService {

    private final UserAccountRepository userAccountRepository;

    @Autowired
    public UserAccountService(UserAccountRepository userAccountRepository) {
        this.userAccountRepository = userAccountRepository;
    }


    public Optional<UserAccount> getUserByAlias(String alias){
        System.out.println("Alias: "+alias);
        return userAccountRepository.findByAlias(alias);
    }

    public long getUserIdByAlias(String alias) throws UserNotFoundException {
        if (userAccountRepository.findByAlias(alias).isEmpty()) {
            throw new UserNotFoundException("User not found with alias: " + alias);
        }
        return userAccountRepository.findByAlias(alias).get().getId();
    }

    public Optional<UserAccount> getUserById(long id){
        return userAccountRepository.findById(id);
    }


    public static class UserNotFoundException extends Exception {
        public UserNotFoundException(String message) {
            super(message);
        }
    }

    public boolean isUserUnique(String username, String email, String alias) {
        return userAccountRepository.findByUsername(username).isEmpty() &&
                userAccountRepository.findByEmail(email).isEmpty() &&
                userAccountRepository.findByAlias(alias).isEmpty();
    }

    public boolean isUsernameAvailable(String username) {
        return userAccountRepository.findByUsername(username).isEmpty();
    }

    public boolean isEmailAvailable(String email) {
        return userAccountRepository.findByEmail(email).isEmpty();
    }

    public boolean isAliasAvailable(String alias) {
        return userAccountRepository.findByEmail(alias).isEmpty();
    }

//    public Usr createUsr(UsrDto usrDto) {
//        Usr usr = new Usr();
//        usr.setUsername(usrDto.getUsername());
//        usr.setPassword(usrDto.getPassword());
//        usr.setEmail(usrDto.getEmail());
//        usr.setAlias(usrDto.getAlias());
//        return userAccountRepository.save(usr);
//    }

}
