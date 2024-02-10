package com.wedding.invitation.dtos;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class GuestDto {
    private String guestName;

    @Size(min = 9, max = 13, message = "Numer telefonu musi zawierać od 9 do 13 cyfr")
    private String guestPhone;

    @Email(message = "Nieprawidłowy format adresu e-mail")
    private String guestEmail;

    @AssertTrue(message = "Przynajmniej jedno pole (imię, telefon, email) musi być wypełnione")
    public boolean isAtLeastOneFieldSet() {
        return (guestName != null && !guestName.isBlank())
                || (guestPhone != null && !guestPhone.isBlank())
                || (guestEmail != null && !guestEmail.isBlank());
    }
}
