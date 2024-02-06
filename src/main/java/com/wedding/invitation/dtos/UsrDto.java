package com.wedding.invitation.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class UsrDto {


    private long id;


    @NotBlank(message = "Username nie może być pusty")
    @Size(min = 3, message = "Username musi zawierać co najmniej 3 znaki")
    private String username;

    // password should not be null or empty
    // password should have at least 8 characters
    @NotBlank(message = "Hasło nie może być puste")
    @Size(min = 8, message = "Hasło musi mieć co najmniej 8 znaków")
    private String password;

    @NotBlank(message = "Email nie może być pusty")
    @Email(message = "Nieprawidłowy format adresu email")
    private String email;

    @NotBlank(message = "Alias nie może być pusty")
    @Size(min = 3, max = 20, message = "Alias musi zawierać co od 3 do 20 znaków")
    private String alias;

    // Gettery i settery
}

