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
    private final FacilityRepository facilityRepository;
    private final GalleryRepository galleryRepository;
    private final GuestsRepository guestsRepository;
    private final ImageRepository imageRepository;
    private final PartnerDetailsRepository partnerDetailsRepository;
    private final UserAccountRepository userAccountRepository;
    private final WeddingDetailsRepository weddingDetailsRepository;
    private final WeddingMediaRepository weddingMediaRepository;
    private final WeddingStoryRepository weddingStoryRepository;
    private final WishRepository wishRepository;

    @Autowired
    public DbInit(EventRepository eventRepository, FacilityRepository facilityRepository, GalleryRepository galleryRepository, GuestsRepository guestsRepository, ImageRepository imageRepository, PartnerDetailsRepository partnerDetailsRepository, UserAccountRepository userAccountRepository, WeddingDetailsRepository weddingDetailsRepository, WeddingMediaRepository weddingMediaRepository, WeddingStoryRepository weddingStoryRepository, WishRepository wishRepository) {
        this.eventRepository = eventRepository;
        this.facilityRepository = facilityRepository;
        this.galleryRepository = galleryRepository;
        this.guestsRepository = guestsRepository;
        this.imageRepository = imageRepository;
        this.partnerDetailsRepository = partnerDetailsRepository;
        this.userAccountRepository = userAccountRepository;
        this.weddingDetailsRepository = weddingDetailsRepository;
        this.weddingMediaRepository = weddingMediaRepository;
        this.weddingStoryRepository = weddingStoryRepository;
        this.wishRepository = wishRepository;
    }



    //    UserAccount
    //      PartnerDetails (ManyToOne)  dwóch partnerów do jednego konta
    //      WeddingDetails (OneToOne)   jedne szczególy do jednego konta
    //        Facility     (ManyToOne)  wiele udogodnień do jednych szczegółów
    //      WeddingMedia   (OneToOne)   jedne media do jednego konta
    //        Gallery      (ManyToOne)  wiele galerii do jednego konta
    //          Image      (ManyToOne)  wiele zdjęć do jednej galerii
    //      WeddingStory   (OneToOne)   jedna historia do jednego konta
    //        Event        (ManyToOne)  wiele wydarzeń do jednej historii
    //        Guest        (ManyToOne)  wiele gości do jednej historii
    //        Wish         (ManyToOne)  wiele życzeń do jednej historii

    @Override
    public void run(String... args) {

        UserAccount userAccount = new UserAccount ("user1","password","email@email.pl","alias");
        userAccountRepository.save(userAccount);

        PartnerDetails groom = new PartnerDetails(
                "Józef",
                "Nowak",
                false,
                "123456789",
                "Za mglistymi osadami i wietrznymi wzgórzami, żyje wojownik samotny i gniewny. Już na moment, już za niedługo przyjdzie mu walczyć o rękę królewny."
        );
        PartnerDetails bride = new PartnerDetails(
                "Maria",
                "Kowalska",
                true,
                "987654321",
                "Pośród starych lasów i srebrzystych strumieni, Panna Młoda w swej urodzie tkwi, jak ze snów wyjęta królewna, która czeka na swojego rycerza, by w miłości odnaleźć spokój i szczęście wieczne."
        );
        groom.setUserAccount(userAccount);
        bride.setUserAccount(userAccount);
        partnerDetailsRepository.saveAll(List.of(bride,groom));

        WeddingDetails weddingDetails = new WeddingDetails(
                Date.from(LocalDateTime.of(2024, 3, 31, 8, 0).atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(LocalDateTime.of(2024, 3, 31, 9, 0).atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(LocalDateTime.of(2024, 3, 31, 9, 30).atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(LocalDateTime.of(2024, 4, 1, 6, 0).atZone(ZoneId.systemDefault()).toInstant()),
                "Tarnobrzeg",
                "Sandomierz",
                "Blablabla Opis Opis Ślub",
                "Blablabla Opis Opis Wesele");
        weddingDetails.setUserAccount(userAccount);
        weddingDetailsRepository.save(weddingDetails);

        Facility facility1 = new Facility("Menu do wyboru", "icon-calendar", "Oprócz całej masy przekąsek, mamy również do wyboru kilka rodzajów dań głównych, w których najbardziej wymagający smakosze znajdą coś dla siebie. Rozumiemy również wszelkie alergie, nietolerancje i filozofie odżywiania. Chcemy wyjść im naprzeciw, zapewniając bogate menu weselne.");
        Facility facility2 = new Facility("Animacje dla dzieci", "icon-image", "Nie tylko dorośli bawią się dobrze na naszym weselu. Każdy musi czy się świetnie, w tym Wasze pociechy. Zespół doświadczonych animatorów już czeka z głową pełną pomysłów i wielkimi torbami zabawek.");
        Facility facility3 = new Facility("Fotobudka", "icon-video", "Myślisz, że jesteś na to zbyt poważny? To nieprawda, załóż śmieszną czapkę i zrób minę do kamery. Obiecujemy, że będziemy się z Ciebie śmiać.");
        facility1.setWeddingDetails(weddingDetails);
        facility2.setWeddingDetails(weddingDetails);
        facility3.setWeddingDetails(weddingDetails);
        facilityRepository.saveAll(List.of(facility1, facility2, facility3));

        WeddingMedia weddingMedia = new WeddingMedia(
                "/images/user1/img_bg_2.jpg",
                "/images/user1/groom.jpg",
                "/images/user1/bride.jpg",
                "/images/user1/img_bg_3.jpg",
                "/images/user1/img_bg_5.jpg",
                "/images/user1/img_bg_4.jpg",
                "https://vimeo.com/channels/staffpicks/93951774",
                "/images/user1/img_bg_3.jpg"
        );
        weddingMedia.setUserAccount(userAccount);
        weddingMediaRepository.saveAll(List.of(weddingMedia));

        Gallery gallery1 = new Gallery("Galeria nr 1", "Super galeria");
        Gallery gallery2 = new Gallery("Galeria nr 2", "Też świetna galeria");
        Gallery gallery3 = new Gallery("Galeria nr 3", "Ta też ujdzie w tłumie");
        gallery1.setWeddingMedia(weddingMedia);
        gallery2.setWeddingMedia(weddingMedia);
        gallery3.setWeddingMedia(weddingMedia);
        galleryRepository.saveAll(List.of(gallery1, gallery2, gallery3));

        Image image1 = new Image("Zdjęcie nr 1", "/images/user1/gallery-1.jpg");
        Image image2 = new Image("Zdjęcie nr 2", "/images/user1/gallery-2.jpg");
        Image image3 = new Image("Zdjęcie nr 3", "/images/user1/gallery-3.jpg");
        Image image4 = new Image("Zdjęcie nr 4", "/images/user1/gallery-4.jpg");
        Image image5 = new Image("Zdjęcie nr 5", "/images/user1/gallery-5.jpg");
        Image image6 = new Image("Zdjęcie nr 6", "/images/user1/gallery-6.jpg");
        Image image7 = new Image("Zdjęcie nr 7", "/images/user1/gallery-7.jpg");
        Image image8 = new Image("Zdjęcie nr 8", "/images/user1/gallery-8.jpg");
        Image image9 = new Image("Zdjęcie nr 9", "/images/user1/gallery-9.jpg");
        image1.setGallery(gallery1);
        image2.setGallery(gallery1);
        image3.setGallery(gallery1);
        image4.setGallery(gallery2);
        image5.setGallery(gallery2);
        image6.setGallery(gallery2);
        image7.setGallery(gallery3);
        image8.setGallery(gallery3);
        image9.setGallery(gallery3);
        imageRepository.saveAll(List.of(image1,image2,image3,image4,image5,image6,image7,image8,image9));

        WeddingStory weddingStory = new WeddingStory(
                "Gdzie trakty handlowe nie dochodzą, gdzie wiatry nie mają czego omijać, na mazurskiej dziewiczej ziemi, mieszkała niedaleko siebie para zakochanych nastolatków.",
                250,
                125,
                475,
                175
        );
        weddingStory.setUserAccount(userAccount);
        weddingStoryRepository.saveAll(List.of(weddingStory));

        Event event1 = new Event("Pierwsze spojrzenie", new Date(System.currentTimeMillis()), "/images/user1/couple-1.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.");
        Event event2 = new Event("Drugie spojrzenie", new Date(System.currentTimeMillis()), "/images/user1/couple-2.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.");
        Event event3 = new Event("Trzecie spojrzenie", new Date(System.currentTimeMillis()), "/images/user1/couple-3.jpg", "Para młoda poznała się podczas przypadkowego spotkania na plaży. Gdy ich spojrzenia się skrzyżowały, natychmiast wiedzieli, że są dla siebie stworzeni i zakochali się od pierwszego wejrzenia, odczuwając silne połączenie, które trwało przez wiele lat.");
        event1.setWeddingStory(weddingStory);
        event2.setWeddingStory(weddingStory);
        event3.setWeddingStory(weddingStory);
        eventRepository.saveAll(List.of(event1, event2, event3));

        Guest guest1 = new Guest("Maciej Wyrzykowski", "aa@bb.cc", "123456789");
        guest1.setWeddingStory(weddingStory);
        guestsRepository.saveAll(List.of(guest1));

        Wish wish1 = new Wish("Krzysztof", "Twitter", "/images/user1/couple-1.jpg", "Wszystkiego najlepszego!");
        Wish wish2 = new Wish("Piotr", "Facebook", "/images/user1/couple-2.jpg", "100 lat na nowej drodze życia!");
        Wish wish3 = new Wish("Marek", "SMS", "/images/user1/couple-3.jpg", "Najlepszego dla Was! Dużo zdrówka!");
        wish1.setWeddingStory(weddingStory);
        wish2.setWeddingStory(weddingStory);
        wish3.setWeddingStory(weddingStory);
        wishRepository.saveAll(List.of(wish1,wish2,wish3));
    }
}
