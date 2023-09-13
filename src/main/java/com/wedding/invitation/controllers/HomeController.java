package com.wedding.invitation.controllers;

import com.wedding.invitation.models.Image;
import com.wedding.invitation.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
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
    private final UsersService usersService;
    private final SimpleDateFormat simpleDateFormat;
    private final EmailService emailService;


    @Autowired
    public HomeController(EventService eventService, WishService wishService, FacilityService facilityService, ImageService imageGalleryService, GalleryService galleryService, UsersService usersService, SimpleDateFormat simpleDateFormat, EmailService emailService) {
        this.eventService = eventService;
        this.wishService = wishService;
        this.facilityService = facilityService;
        this.imageService = imageGalleryService;
        this.galleryService = galleryService;
        this.usersService = usersService;
        this.simpleDateFormat = simpleDateFormat;
        this.emailService = emailService;
    }

    @GetMapping("/home")
    public String home(Model model, @RequestParam("id") long id) {
        if (usersService.getUserById(id).isPresent()) {
            String eventTitle = "ŚLUB " + usersService.getUserById(id).get().getBrideName() + "&" + usersService.getUserById(id).get().getGroomName();
            String ceremonyDescription = usersService.getUserById(id).get().getCeremonyDescription();
            String eventLocation = usersService.getUserById(id).get().getCeremonyLocation();
            Date ceremonyDate = usersService.getUserById(id).get().getCeremonyStartDate();
            Date weddingEnd = usersService.getUserById(id).get().getWeddingPartyEndDate();
            model.addAttribute("eventTitle", eventTitle);
            model.addAttribute("ceremonyStartObject", ceremonyDate);
            model.addAttribute("ceremonyEndObject", usersService.getUserById(id).get().getCeremonyEndDate());
            model.addAttribute("weddingPartyStartObject", usersService.getUserById(id).get().getWeddingPartyStartDate());
            model.addAttribute("weddingPartyEndObject", weddingEnd);
            model.addAttribute("weddingLocation", eventLocation);
            model.addAttribute("groomName", usersService.getUserById(id).get().getGroomName());
            model.addAttribute("brideName", usersService.getUserById(id).get().getBrideName());
            model.addAttribute("groomLastName", usersService.getUserById(id).get().getGroomLastName());
            model.addAttribute("brideLastName", usersService.getUserById(id).get().getBrideLastName());
            model.addAttribute("groomDescription", usersService.getUserById(id).get().getGroomDescription());
            model.addAttribute("brideDescription", usersService.getUserById(id).get().getBrideDescription());
            model.addAttribute("ceremonyDescription", ceremonyDescription);
            model.addAttribute("weddingPartyDescription", usersService.getUserById(id).get().getWeddingPartyDescription());
            model.addAttribute("saveDateLink", generateGoogleCalendarLink(eventTitle, ceremonyDescription, eventLocation, ceremonyDate, weddingEnd));
            simpleDateFormat.applyPattern("dd MMMM yyyy");
            model.addAttribute("dateAndPlace", simpleDateFormat.format(usersService.getUserById(id).get().getCeremonyStartDate()) + " r., " + usersService.getUserById(id).get().getCeremonyLocation());
            model.addAttribute("shortLoveStory", usersService.getUserById(id).get().getShortLoveStory());
            model.addAttribute("eventList", eventService.getAllEvents());
            model.addAttribute("weddingInvitedGuests", usersService.getUserById(id).get().getWeddingInvitedGuests());
            model.addAttribute("weddingConfirmedGuests", usersService.getUserById(id).get().getWeddingConfirmedGuests());
            model.addAttribute("eventsDoneInThisPlace", usersService.getUserById(id).get().getEventsDoneInThisPlace());
            model.addAttribute("hoursSpentOnPreparing", usersService.getUserById(id).get().getHoursSpentOnPreparing());
            model.addAttribute("wishList", wishService.getAllWishes());
            model.addAttribute("facilityList", facilityService.getAllFacilities());
            model.addAttribute("videoUrl", usersService.getUserById(id).get().getVideoUrl());
            model.addAttribute("videoThumbnail", usersService.getUserById(id).get().getVideoThumbnail());
            model.addAttribute("imageList", imageService.getAllImages());
            model.addAttribute("galleryList", galleryService.getAllGallery());
        }
        return "index";
    }

    @GetMapping("/{id}")
    @ResponseBody
    String showImage(@PathVariable("id") Long id) {

        Optional<Image> imageGalleryOptional = imageService.getImageById(id);
        if (imageGalleryOptional.isPresent()) {
            Image imageGallery = imageGalleryOptional.get();
            return "<img src=" + imageGallery.getImageUrl() + ">";
        } else {
            return "Not found";
        }

    }


    public String generateGoogleCalendarLink(
            String eventName,
            String eventDescription,
            String eventLocation,
            Date eventStartDate,
            Date eventEndDate) {

        simpleDateFormat.applyPattern("yyyyMMdd'T'HHmmss'Z'");
        String result = "https://www.google.com/calendar/event?action=TEMPLATE" +
                "&text=" + URLEncoder.encode(eventName, StandardCharsets.UTF_8) +
                "&details=" + URLEncoder.encode(eventDescription, StandardCharsets.UTF_8) +
                "&location=" + URLEncoder.encode(eventLocation, StandardCharsets.UTF_8) +
                "&dates=" + simpleDateFormat.format(eventStartDate) + "/" + simpleDateFormat.format(eventEndDate);
        return result;
    }



//    @ResponseBody
//    @PostMapping("/send-email")
//    public String sendEmail(
//            @RequestParam(value = "to") String to,
//            @RequestParam(value = "subject") String subject,
//            @RequestParam(value = "body") String body) {
//        emailService.sendEmail(to, subject, body);
//        return "Mail sent to: "+to;
//    }



    @ResponseBody
    @PostMapping("/send-email")
    public String sendEmail(
            @RequestParam(value = "name") String name,
            @RequestParam(value = "phone") String phone,
            @RequestParam(value = "email") String email) {
        String to = "m.wyr@o2.pl";
        String subject = "Potwierdzenie obecności.";
        String body = name + " potwierdził(a) obecność. \nNumer telefonu: " + phone+ "\nAdres email: "+email;
        emailService.sendEmail(to, subject, body);
        return "Mail sent to: "+to;
    }
}



