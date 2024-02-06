package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Image;
import com.wedding.invitation.models.PartnerDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartnerDetailsRepository extends JpaRepository<PartnerDetails, Long> {
}
