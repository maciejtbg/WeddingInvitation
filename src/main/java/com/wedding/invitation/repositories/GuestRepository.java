package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest,Long> {

//    @Query("SELECT g FROM Guest WHERE g.guestPhone = :phone OR g.guestEmail = :email OR g.guestName = :name")
    @Query(value = "SELECT * FROM Guest WHERE GUEST_PHONE = ?1 or GUEST_EMAIL = ?2 or GUEST_NAME = ?3", nativeQuery = true)
    Optional<Guest> findByPhoneOrEmailOrName(String phone, String email, String name);

    List<Guest> findByConfirmed(boolean confirmed);

}
