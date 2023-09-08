package com.wedding.invitation.controllers;

import com.wedding.invitation.models.Image;
import com.wedding.invitation.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Optional;

@Controller
@RequestMapping()
public class HomeController {

    private final EventService eventService;
    private final WishService wishService;
    private final FacilityService facilityService;

    private final ImageService imageService;

    private final GalleryService galleryService;

    private final SimpleDateFormat simpleDateFormat;





    @Autowired
    public HomeController(EventService eventService, WishService wishService, FacilityService facilityService, ImageService imageGalleryService, GalleryService galleryService, SimpleDateFormat simpleDateFormat) {
        this.eventService = eventService;
        this.wishService = wishService;
        this.facilityService = facilityService;
        this.imageService = imageGalleryService;
        this.galleryService = galleryService;
        this.simpleDateFormat = simpleDateFormat;
    }

    @GetMapping("/home")
    public String home(Model model){

        String groomName = "Józef";
        String groomLastName = "Nowak";
        String brideName = "Maria";
        String brideLastName = "Kowalska";
        String groomDescription = "Za mglistymi osadami i wietrznymi wzgórzami, żyje wojownik samotny i gniewny. Już na moment, już za niedługo przyjdzie mu walczyć o rękę królewny.";
        String brideDescription = "Pośród starych lasów i srebrzystych strumieni, Panna Młoda w swej urodzie tkwi, jak ze snów wyjęta królewna, która czeka na swojego rycerza, by w miłości odnaleźć spokój i szczęście wieczne.";
        String weddingLocation = "Tarnobrzeg";
        String eventSubject = brideName+"%20&%20"+groomName;
        String eventDescription = "Najlepszy ślub na świecie!";
        eventDescription = eventDescription.replace(" ","%20");
        String shortLoveStory = "Gdzie trakty handlowe nie dochodzą, gdzie wiatry nie mają czego omijać, na mazurskiej dziewiczej ziemi, mieszkała niedaleko siebie para zakochanych nastolatków.";
        int weddingInvitedGuests = 250;
        int weddingConfirmedGuests = 125;
        int eventsDoneInThisPlace = 475;
        int hoursSpentOnPreparing = 175;
        String videoUrl = "https://vimeo.com/channels/staffpicks/93951774";
        String videoThumbnail = "images/img_bg_3.jpg";





        //TODO {Zaimplementować pobieranie czasu z bazy danych}.
        Calendar calendar = Calendar.getInstance();

//        calendar.set(2023, Calendar.AUGUST, 26, 12, 0, 0);
        calendar.add(Calendar.HOUR_OF_DAY,1);
        Date weddingStartDate = calendar.getTime();
        int weddingDuration = 12;
        calendar.add(Calendar.HOUR,weddingDuration);
        Date weddingEndDate = calendar.getTime();

        simpleDateFormat.applyPattern("yyyyMMdd'T'HHmmss");
//        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd'T'HHmmss");
        String formattedWeddingStartDate = simpleDateFormat.format(weddingStartDate);
        String formattedWeddingEndDate = simpleDateFormat.format(weddingEndDate);

        String saveDateLink = "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+eventSubject+"&details="+eventDescription+"%20text&dates="+formattedWeddingStartDate+"/"+formattedWeddingEndDate+"&location="+weddingLocation;


        SimpleDateFormat longDateFormat = new SimpleDateFormat("dd MMMM yyyy");


        model.addAttribute("weddingStartDate",weddingStartDate);
        model.addAttribute("weddingLocation",weddingLocation);
        model.addAttribute("groomName",groomName);
        model.addAttribute("brideName",brideName);
        model.addAttribute("groomLastName",groomLastName);
        model.addAttribute("brideLastName",brideLastName);
        model.addAttribute("groomDescription",groomDescription);
        model.addAttribute("brideDescription",brideDescription);
        model.addAttribute("saveDateLink",saveDateLink);
        model.addAttribute("dateAndPlace",longDateFormat.format(weddingStartDate)+" r., "+weddingLocation);
        model.addAttribute("shortLoveStory",shortLoveStory);

        model.addAttribute("eventList",eventService.getAllEvents());
        model.addAttribute("weddingInvitedGuests",weddingInvitedGuests);
        model.addAttribute("weddingConfirmedGuests",weddingConfirmedGuests);
        model.addAttribute("eventsDoneInThisPlace",eventsDoneInThisPlace);
        model.addAttribute("hoursSpentOnPreparing",hoursSpentOnPreparing);
        model.addAttribute("wishList",wishService.getAllWishes());
        model.addAttribute("facilityList",facilityService.getAllFacilities());
        model.addAttribute("videoUrl",videoUrl);
        model.addAttribute("videoThumbnail",videoThumbnail);
        model.addAttribute("imageList", imageService.getAllImages());
        model.addAttribute("galleryList", galleryService.getAllGallery());


        return "index";
    }

    @GetMapping("/{id}")
    @ResponseBody
    String showImage(@PathVariable("id") Long id) {

        Optional<Image> imageGalleryOptional = imageService.getImageById(id);
        if (imageGalleryOptional.isPresent()) {
            Image imageGallery = imageGalleryOptional.get();
        return "<img src="+imageGallery.getImageUrl()+">";
        } else {
            return "Not found";
        }

    }
}

