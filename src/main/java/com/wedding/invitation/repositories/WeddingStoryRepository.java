package com.wedding.invitation.repositories;

import com.wedding.invitation.models.WeddingMedia;
import com.wedding.invitation.models.WeddingStory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WeddingStoryRepository extends JpaRepository <WeddingStory,Long> {
}
