package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Facility;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FacilityRepository extends JpaRepository<Facility,Long> {
}
