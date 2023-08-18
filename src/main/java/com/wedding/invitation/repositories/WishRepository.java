package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Wish;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WishRepository extends JpaRepository <Wish,Long> {
}
