package com.wedding.invitation.repositories;

import com.wedding.invitation.models.Usr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsrRepository extends JpaRepository<Usr,Long> {
    Optional<Usr> findByAlias(String alias);


}
