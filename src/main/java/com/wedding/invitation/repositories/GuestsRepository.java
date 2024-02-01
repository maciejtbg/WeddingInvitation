package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Guests;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GuestsRepository extends JpaRepository<Guests,Long> {

}
