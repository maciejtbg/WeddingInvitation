package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Guest;
import com.wedding.invitation.models.UserAccount;
import com.wedding.invitation.models.WeddingDetails;
import com.wedding.invitation.models.WeddingMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeddingMediaRepository extends JpaRepository <WeddingMedia,Long> {

    Optional<WeddingMedia> findByUserAccount(UserAccount userAccount);
}
