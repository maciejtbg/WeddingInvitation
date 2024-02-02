package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuestsRepository extends JpaRepository<Guest,Long> {

}
