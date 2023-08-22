package com.wedding.invitation;

import com.wedding.invitation.models.*;
import com.wedding.invitation.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.Date;
import java.util.List;

@Configuration
public class DbInit implements CommandLineRunner {

    private final EventRepository eventRepository;
    private final WishRepository wishRepository;
    private final FacilityRepository facilityRepository;
    private final ImageRepository imageRepository;
    private final GalleryRepository galleryRepository;

    @Autowired
    public DbInit(EventRepository eventRepository, WishRepository wishRepository, FacilityRepository facilityRepository, ImageRepository imageGalleryRepository, GalleryRepository galleryRepository) {
        this.eventRepository = eventRepository;
        this.wishRepository = wishRepository;
        this.facilityRepository = facilityRepository;
        this.imageRepository = imageGalleryRepository;
        this.galleryRepository = galleryRepository;
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
        facilityRepository.saveAll(List.of(
                new Facility("Menu do wyboru","icon-calendar", "Oprócz całej masy przekąsek, mamy również do wyboru kilka rodzajów dań głównych, w których najbardziej wymagający smakosze znajdą coś dla siebie. Rozumiemy również wszelkie alergie, nietolerancje i filozofie odżywiania. Chcemy wyjść im naprzeciw, zapewniając bogate menu weselne."),
                new Facility("Animacje dla dzieci","icon-image", "Nie tylko dorośli bawią się dobrze na naszym weselu. Każdy musi czy się świetnie, w tym Wasze pociechy. Zespół doświadczonych animatorów już czeka z głową pełną pomysłów i wielkimi torbami zabawek."),
                new Facility("Fotobudka","icon-video", "Myślisz, że jesteś na to zbyt poważny? To nieprawda, załóż śmieszną czapkę i zrób minę do kamery. Obiecujemy, że będziemy się z Ciebie śmiać.")
        ));
        Gallery gallery1 = new Gallery("Galeria nr 1", "Super galeria");
        Gallery gallery2 = new Gallery("Galeria nr 2", "Też świetna galeria");
        Gallery gallery3 = new Gallery("Galeria nr 3", "Ta też ujdzie w tłumie");
        galleryRepository.saveAll(List.of(
                gallery1,
                gallery2,
                gallery3
        ));

        imageRepository.saveAll(List.of(
                new Image("Zdjęcie nr 1", "images/gallery-1.jpg",gallery1),
                new Image("Zdjęcie nr 2", "images/gallery-2.jpg",gallery1),
                new Image("Zdjęcie nr 3", "images/gallery-3.jpg",gallery2),
                new Image("Zdjęcie nr 4", "images/gallery-4.jpg",gallery2),
                new Image("Zdjęcie nr 5", "images/gallery-5.jpg",gallery2),
                new Image("Zdjęcie nr 6", "images/gallery-6.jpg",gallery2),
                new Image("Zdjęcie nr 7", "images/gallery-7.jpg",gallery2),
                new Image("Zdjęcie nr 8", "images/gallery-8.jpg",gallery3),
                new Image("Zdjęcie nr 9", "images/gallery-9.jpg",gallery3)
        ));


    }

}
