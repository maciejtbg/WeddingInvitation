package com.wedding.invitation.controllers;

import com.wedding.invitation.dtos.UsrDto;
import com.wedding.invitation.services.UserAccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/usr")
public class UserController {
    private final UserAccountService userAccountService;


    @Autowired
    public UserController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @PostMapping("/check")
    public ResponseEntity<?> checkUserAvailability(@Valid @RequestBody UsrDto request) {
        boolean isUnique = userAccountService.isUserUnique(request.getUsername(), request.getEmail(), request.getAlias());

        if (isUnique) {
            // Użytkownik jest unikalny
            return ResponseEntity.ok(Map.of("message", "Użytkownik jest unikalny"));
        } else {
            // Sprawdzamy, które konkretne dane są już zajęte
            List<String> existingData = new ArrayList<>();
            if (!userAccountService.isUsernameAvailable(request.getUsername())) {
                existingData.add("username: " + request.getUsername());
            }
            if (!userAccountService.isEmailAvailable(request.getEmail())) {
                existingData.add("email: " + request.getEmail());
            }
            if (!userAccountService.isAliasAvailable(request.getAlias())) {
                existingData.add("alias: " + request.getAlias());
            }

            String message = "W bazie danych już istnieją takie dane";
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", message, "existingData", existingData));
        }
    }

//    @PostMapping("/create")
//    public ResponseEntity<?> createUser(@Valid @RequestBody UsrDto usrDto){
//        Usr usr = usrService.createUsr(usrDto);
//        return  ResponseEntity.status(HttpStatus.CREATED).body(usr);
//
//    }


    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public  Map<String, String> handleValidationException(MethodArgumentNotValidException ex){
        Map <String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return errors;
    }


}
