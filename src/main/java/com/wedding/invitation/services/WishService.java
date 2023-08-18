package com.wedding.invitation.services;

        import com.wedding.invitation.models.Wish;
        import com.wedding.invitation.repositories.WishRepository;
        import org.springframework.beans.factory.annotation.Autowired;
        import org.springframework.stereotype.Service;
        import java.util.List;

@Service
public class WishService {

    private final WishRepository wishRepository;


    @Autowired
    public WishService(WishRepository wishRepository) {
        this.wishRepository = wishRepository;
    }

    public List<Wish> getAllWishes() {return wishRepository.findAll();}

}

