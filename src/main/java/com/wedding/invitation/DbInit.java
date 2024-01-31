package com.wedding.invitation;

import com.wedding.invitation.models.*;
import com.wedding.invitation.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

@Configuration
public class DbInit implements CommandLineRunner {

    private final EventRepository eventRepository;
    private final WishRepository wishRepository;
    private final FacilityRepository facilityRepository;
    private final ImageRepository imageRepository;
    private final GalleryRepository galleryRepository;
    private final UsersRepository usersRepository;

    @Autowired
    public DbInit(EventRepository eventRepository, WishRepository wishRepository, FacilityRepository facilityRepository, ImageRepository imageGalleryRepository, GalleryRepository galleryRepository, UsersRepository usersRepository) {
        this.eventRepository = eventRepository;
        this.wishRepository = wishRepository;
        this.facilityRepository = facilityRepository;
        this.imageRepository = imageGalleryRepository;
        this.galleryRepository = galleryRepository;
        this.usersRepository = usersRepository;
    }

    @Override
    public void run(String... args) {
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

        usersRepository.save(
                new Users(
                        "username",
                        "password",
                        "email@email.pl",
                        "mariajozef", //tu nie może być znaków specjalych używanych w zapytaniach np. ? $
                        Date.from(LocalDateTime.of(2023, 12, 31, 8, 0).atZone(ZoneId.systemDefault()).toInstant()),
                        Date.from(LocalDateTime.of(2023, 12, 31, 9, 0).atZone(ZoneId.systemDefault()).toInstant()),
                        Date.from(LocalDateTime.of(2023, 12, 31, 9, 30).atZone(ZoneId.systemDefault()).toInstant()),
                        Date.from(LocalDateTime.of(2024, 1, 1, 6, 0).atZone(ZoneId.systemDefault()).toInstant()),
                        "Tarnobrzeg",
                        "Sandomierz",
                        "Józef",
                        "Nowak",
                        "123456789",
                        "Maria",
                        "Kowalska",
                        "987654321",
                        "Za mglistymi osadami i wietrznymi wzgórzami, żyje wojownik samotny i gniewny. Już na moment, już za niedługo przyjdzie mu walczyć o rękę królewny.",
                        "Pośród starych lasów i srebrzystych strumieni, Panna Młoda w swej urodzie tkwi, jak ze snów wyjęta królewna, która czeka na swojego rycerza, by w miłości odnaleźć spokój i szczęście wieczne.",
                        "Blablabla Opis Opis Ślub",
                        "Blablabla Opis Opis Wesele",
                        "Gdzie trakty handlowe nie dochodzą, gdzie wiatry nie mają czego omijać, na mazurskiej dziewiczej ziemi, mieszkała niedaleko siebie para zakochanych nastolatków.",
                        250,
                        125,
                        475,
                        175,
                        "https://vimeo.com/channels/staffpicks/93951774",
                        "images/img_bg_3.jpg"
                )
);
    }
}
