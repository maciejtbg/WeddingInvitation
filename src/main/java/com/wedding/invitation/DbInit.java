package com.wedding.invitation;

import com.wedding.invitation.models.*;
import com.wedding.invitation.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;

@Configuration
public class DbInit implements CommandLineRunner {

    private final EventRepository eventRepository;
    private final WishRepository wishRepository;
    private final FacilityRepository facilityRepository;
    private final ImageRepository imageRepository;
    private final GalleryRepository galleryRepository;
    private final UsrRepository usrRepository;
    private final GuestsRepository guestsRepository;


    @Autowired
    public DbInit(EventRepository eventRepository, WishRepository wishRepository, FacilityRepository facilityRepository, ImageRepository imageGalleryRepository, GalleryRepository galleryRepository, UsrRepository usrRepository, GuestsRepository guestsRepository) {
        this.eventRepository = eventRepository;
        this.wishRepository = wishRepository;
        this.facilityRepository = facilityRepository;
        this.imageRepository = imageGalleryRepository;
        this.galleryRepository = galleryRepository;
        this.usrRepository = usrRepository;
        this.guestsRepository = guestsRepository;
    }

    @Override
    public void run(String... args) {

        Usr usr1 = new Usr(
                "user1",
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
                "/images/user1/img_bg_2.jpg",
                "/images/user1/groom.jpg",
                "/images/user1/bride.jpg",
                "/images/user1/img_bg_3.jpg",
                "/images/user1/img_bg_5.jpg",
                "/images/user1/img_bg_4.jpg",
                "https://vimeo.com/channels/staffpicks/93951774",
                "/images/user1/img_bg_3.jpg"
        );

        usrRepository.saveAll(List.of(usr1));

        Event event1 = new Event("Pierwsze spojrzenie", new Date(System.currentTimeMillis()), "/images/user1/couple-1.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.", usr1);
        Event event2 = new Event("Drugie spojrzenie", new Date(System.currentTimeMillis()), "/images/user1/couple-2.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.", usr1);
        Event event3 = new Event("Trzecie spojrzenie", new Date(System.currentTimeMillis()), "/images/user1/couple-3.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.", usr1);


        eventRepository.saveAll(List.of(
                event1,
                event2,
                event3
        ));

        Wish wish1 = new Wish("Krzysztof", "Twitter", "/images/user1/couple-1.jpg", "Wszystkiego najlepszego!", usr1);
        Wish wish2 = new Wish("Piotr", "Facebook", "/images/user1/couple-2.jpg", "100 lat na nowej drodze życia!", usr1);
        Wish wish3 = new Wish("Marek", "SMS", "/images/user1/couple-3.jpg", "Najlepszego dla Was! Dużo zdrówka!", usr1);


        wishRepository.saveAll(List.of(
                wish1,
                wish2,
                wish3
        ));

        Facility facility1 = new Facility("Menu do wyboru", "icon-calendar", "Oprócz całej masy przekąsek, mamy również do wyboru kilka rodzajów dań głównych, w których najbardziej wymagający smakosze znajdą coś dla siebie. Rozumiemy również wszelkie alergie, nietolerancje i filozofie odżywiania. Chcemy wyjść im naprzeciw, zapewniając bogate menu weselne.", usr1);
        Facility facility2 = new Facility("Animacje dla dzieci", "icon-image", "Nie tylko dorośli bawią się dobrze na naszym weselu. Każdy musi czy się świetnie, w tym Wasze pociechy. Zespół doświadczonych animatorów już czeka z głową pełną pomysłów i wielkimi torbami zabawek.", usr1);
        Facility facility3 = new Facility("Fotobudka", "icon-video", "Myślisz, że jesteś na to zbyt poważny? To nieprawda, załóż śmieszną czapkę i zrób minę do kamery. Obiecujemy, że będziemy się z Ciebie śmiać.", usr1);

        facilityRepository.saveAll(List.of(
                facility1,
                facility2,
                facility3
        ));

        Gallery gallery1 = new Gallery("Galeria nr 1", "Super galeria", usr1);
        Gallery gallery2 = new Gallery("Galeria nr 2", "Też świetna galeria", usr1);
        Gallery gallery3 = new Gallery("Galeria nr 3", "Ta też ujdzie w tłumie", usr1);
        galleryRepository.saveAll(List.of(
                gallery1,
                gallery2,
                gallery3
        ));

        Image image1 = new Image("Zdjęcie nr 1", "/images/user1/gallery-1.jpg", gallery1);
        Image image2 = new Image("Zdjęcie nr 2", "/images/user1/gallery-2.jpg", gallery1);
        Image image3 = new Image("Zdjęcie nr 3", "/images/user1/gallery-3.jpg", gallery2);
        Image image4 = new Image("Zdjęcie nr 4", "/images/user1/gallery-4.jpg", gallery2);
        Image image5 = new Image("Zdjęcie nr 5", "/images/user1/gallery-5.jpg", gallery2);
        Image image6 = new Image("Zdjęcie nr 6", "/images/user1/gallery-6.jpg", gallery2);
        Image image7 = new Image("Zdjęcie nr 7", "/images/user1/gallery-7.jpg", gallery2);
        Image image8 = new Image("Zdjęcie nr 8", "/images/user1/gallery-8.jpg", gallery3);
        Image image9 = new Image("Zdjęcie nr 9", "/images/user1/gallery-9.jpg", gallery3);

        imageRepository.saveAll(List.of(
                image1,
                image2,
                image3,
                image4,
                image5,
                image6,
                image7,
                image8,
                image9
        ));

        Guest guest1 = new Guest("Maciej Wyrzykowski", "aa@bb.cc", "123456789", usr1);

        guestsRepository.saveAll(List.of(
                        guest1
                ));


        Usr usr2 = new Usr(
                "user2",
                "password",
                "email@email.pl",
                "aniapiotr", //tu nie może być znaków specjalych używanych w zapytaniach np. ? $
                Date.from(LocalDateTime.of(2024, 2, 28, 8, 0).atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(LocalDateTime.of(2024, 2, 28, 9, 0).atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(LocalDateTime.of(2024, 2, 28, 9, 30).atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(LocalDateTime.of(2024, 3, 1, 6, 0).atZone(ZoneId.systemDefault()).toInstant()),
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
                "/images/user2/img_bg_2.jpg",
                "/images/user2/groom.jpg",
                "/images/user2/bride.jpg",
                "/images/user2/img_bg_3.jpg",
                "/images/user2/img_bg_5.jpg",
                "/images/user2/img_bg_4.jpg",
                "https://vimeo.com/channels/staffpicks/93951774",
                "/images/user2/img_bg_3.jpg"
        );

        usrRepository.saveAll(List.of(usr2));

        Event event4 = new Event("Pierwsze spojrzenie", new Date(System.currentTimeMillis()), "/images/user2/couple-1.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.", usr2);
        Event event5 = new Event("Drugie spojrzenie", new Date(System.currentTimeMillis()), "/images/user2/couple-2.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.", usr2);
        Event event6 = new Event("Trzecie spojrzenie", new Date(System.currentTimeMillis()), "/images/user2/couple-3.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.", usr2);


        eventRepository.saveAll(List.of(
                event4,
                event5,
                event6
        ));

        Wish wish4 = new Wish("Krzysztof", "Twitter", "/images/user2/woman_1.jpg", "Wszystkiego najlepszego!", usr2);
        Wish wish5 = new Wish("Piotr", "Facebook", "/images/user2/bride_1.jpg", "100 lat na nowej drodze życia!", usr2);
        Wish wish6 = new Wish("Marek", "SMS", "/images/user2/couple-3.jpg", "Najlepszego dla Was! Dużo zdrówka!", usr2);


        wishRepository.saveAll(List.of(
                wish4,
                wish5,
                wish6
        ));

        Facility facility4 = new Facility("Menu do wyboru", "icon-calendar", "Oprócz całej masy przekąsek, mamy również do wyboru kilka rodzajów dań głównych, w których najbardziej wymagający smakosze znajdą coś dla siebie. Rozumiemy również wszelkie alergie, nietolerancje i filozofie odżywiania. Chcemy wyjść im naprzeciw, zapewniając bogate menu weselne.", usr2);
        Facility facility5 = new Facility("Animacje dla dzieci", "icon-image", "Nie tylko dorośli bawią się dobrze na naszym weselu. Każdy musi czy się świetnie, w tym Wasze pociechy. Zespół doświadczonych animatorów już czeka z głową pełną pomysłów i wielkimi torbami zabawek.", usr2);
        Facility facility6 = new Facility("Fotobudka", "icon-video", "Myślisz, że jesteś na to zbyt poważny? To nieprawda, załóż śmieszną czapkę i zrób minę do kamery. Obiecujemy, że będziemy się z Ciebie śmiać.", usr2);

        facilityRepository.saveAll(List.of(
                facility4,
                facility5,
                facility6
        ));

        Gallery gallery4 = new Gallery("Galeria nr 1", "Przygowania do wesela", usr2);
        Gallery gallery5 = new Gallery("Galeria nr 2", "Najważniejszy moment ślubu", usr2);
        Gallery gallery6 = new Gallery("Galeria nr 3", "Wspaniałe wesele", usr2);
        galleryRepository.saveAll(List.of(
                gallery4,
                gallery5,
                gallery6
        ));

        Image image10 = new Image("Zdjęcie nr 1", "/images/user2/prep_1.jpg", gallery4);
        Image image11 = new Image("Zdjęcie nr 2", "/images/user2/prep_2.jpg", gallery4);
        Image image12 = new Image("Zdjęcie nr 3", "/images/user2/prep_3.jpg", gallery4);
        Image image13 = new Image("Zdjęcie nr 4", "/images/user2/wedding_1.jpg", gallery5);
        Image image14 = new Image("Zdjęcie nr 5", "/images/user2/wedding_2.jpg", gallery5);
        Image image15 = new Image("Zdjęcie nr 6", "/images/user2/wedding_3.jpg", gallery5);
        Image image16 = new Image("Zdjęcie nr 7", "/images/user2/party_1.jpg", gallery6);
        Image image17 = new Image("Zdjęcie nr 8", "/images/user2/party_2.jpg", gallery6);
        Image image18 = new Image("Zdjęcie nr 9", "/images/user2/party_3.jpg", gallery6);
        imageRepository.saveAll(List.of(
                image10,
                image11,
                image12,
                image13,
                image14,
                image15,
                image16,
                image17,
                image18
        ));

        Guest guest2 = new Guest("Maciej Wyrzykowski", "aa@bb.cc", "123456789", usr2);

        guestsRepository.saveAll(List.of(
                guest2
        ));

    }
}
