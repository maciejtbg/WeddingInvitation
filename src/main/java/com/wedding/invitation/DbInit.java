package com.wedding.invitation;

import com.wedding.invitation.models.Event;
import com.wedding.invitation.models.Wish;
import com.wedding.invitation.repositories.EventRepository;
import com.wedding.invitation.repositories.WishRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Date;
import java.util.List;

@Configuration
public class DbInit implements CommandLineRunner {

    private final EventRepository eventRepository;
    private final WishRepository wishRepository;

    @Autowired
    public DbInit(EventRepository eventRepository, WishRepository wishRepository) {
        this.eventRepository = eventRepository;
        this.wishRepository = wishRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        eventRepository.saveAll(List.of(
                new Event("Pierwsze spojrzenie",new Date(System.currentTimeMillis()),"images/couple-1.jpg","Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat."),
                new Event("Drugie spojrzenie",new Date(System.currentTimeMillis()),"images/couple-2.jpg","Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat."),
                new Event("Trzecie spojrzenie",new Date(System.currentTimeMillis()),"images/couple-3.jpg","Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.")
        ));

        wishRepository.saveAll(List.of(
                new Wish("Krzysztof", "Twitter", "images/couple-1.jpg", "Wszystkiego najlepszego!"),
                new Wish("Piotr", "Facebook", "images/couple-2.jpg", "100 lat na nowej drodze życia!"),
                new Wish("Marek", "SMS", "images/couple-3.jpg", "Najlepszego dla Was! Dużo zdrówka!")
                ));
    }
}
