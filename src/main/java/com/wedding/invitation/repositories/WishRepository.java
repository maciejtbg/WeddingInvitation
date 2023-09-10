package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Wish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WishRepository extends JpaRepository <Wish,Long> {
}
