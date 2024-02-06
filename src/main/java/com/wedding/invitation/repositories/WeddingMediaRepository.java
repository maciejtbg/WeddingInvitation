package com.wedding.invitation.repositories;

import com.wedding.invitation.models.WeddingDetails;
import com.wedding.invitation.models.WeddingMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeddingMediaRepository extends JpaRepository <WeddingMedia,Long> {
}
