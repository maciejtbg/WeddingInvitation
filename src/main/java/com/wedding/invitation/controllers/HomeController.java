package com.wedding.invitation.controllers;

import com.wedding.invitation.models.Image;
import com.wedding.invitation.models.Users;
import com.wedding.invitation.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Optional;
import java.util.regex.Pattern;


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

    @GetMapping("/{alias}")
    public String home(Model model, @PathVariable String alias) {
        Optional<Users> userOptional = usersService.getUserByAlias(alias);
        System.out.println(alias);
        System.out.println(userOptional.get());

        if (userOptional.isPresent()) {
            Users user = userOptional.get();
            String eventTitle = "ŚLUB " + user.getBrideName() + "&" + user.getGroomName();
            String ceremonyDescription = user.getCeremonyDescription();
            String eventLocation = user.getCeremonyLocation();
            Date ceremonyDate = user.getCeremonyStartDate();
            Date weddingEnd = user.getWeddingPartyEndDate();
            model.addAttribute("eventTitle", eventTitle);
            model.addAttribute("ceremonyStartObject", ceremonyDate);
            model.addAttribute("ceremonyEndObject", user.getCeremonyEndDate());
            model.addAttribute("weddingPartyStartObject", user.getWeddingPartyStartDate());
            model.addAttribute("weddingPartyEndObject", weddingEnd);
            model.addAttribute("weddingLocation", eventLocation);
            model.addAttribute("groomName", user.getGroomName());
            model.addAttribute("brideName", user.getBrideName());
            model.addAttribute("groomLastName", user.getGroomLastName());
            model.addAttribute("brideLastName", user.getBrideLastName());
            model.addAttribute("groomDescription", user.getGroomDescription());
            model.addAttribute("brideDescription", user.getBrideDescription());
            model.addAttribute("ceremonyDescription", ceremonyDescription);
            model.addAttribute("weddingPartyDescription", user.getWeddingPartyDescription());
            model.addAttribute("saveDateLink", generateGoogleCalendarLink(eventTitle, ceremonyDescription, eventLocation, ceremonyDate, weddingEnd));
            simpleDateFormat.applyPattern("dd MMMM yyyy");
            model.addAttribute("dateAndPlace", simpleDateFormat.format(user.getCeremonyStartDate()) + " r., " + user.getCeremonyLocation());
            model.addAttribute("shortLoveStory", user.getShortLoveStory());
            model.addAttribute("eventList", eventService.getAllEvents());
            model.addAttribute("weddingInvitedGuests", user.getWeddingInvitedGuests());
            model.addAttribute("weddingConfirmedGuests", user.getWeddingConfirmedGuests());
            model.addAttribute("eventsDoneInThisPlace", user.getEventsDoneInThisPlace());
            model.addAttribute("hoursSpentOnPreparing", user.getHoursSpentOnPreparing());
            model.addAttribute("wishList", wishService.getAllWishes());
            model.addAttribute("facilityList", facilityService.getAllFacilities());
            model.addAttribute("videoUrl", user.getVideoUrl());
            model.addAttribute("videoThumbnail", user.getVideoThumbnail());
            model.addAttribute("imageList", imageService.getAllImages());
            model.addAttribute("galleryList", galleryService.getAllGallery());
        }
        return "index";
    }

//    @GetMapping("/{id}")
//    @ResponseBody
//    String showImage(@PathVariable("id") Long id) {
//
//        Optional<Image> imageGalleryOptional = imageService.getImageById(id);
//        if (imageGalleryOptional.isPresent()) {
//            Image imageGallery = imageGalleryOptional.get();
//            return "<img src=" + imageGallery.getImageUrl() + ">";
//        } else {
//            return "Not found";
//        }
//
//    }


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



//    @ResponseBody
//    @PostMapping("/send-email")
//    public String sendEmail(
//            @RequestParam(value = "name") String name,
//            @RequestParam(value = "phone") String phone,
//            @RequestParam(value = "email") String email) {
//        String to = "m.wyr@o2.pl";
//        String subject = "Potwierdzenie obecności.";
//        String body = name + " potwierdził(a) obecność. \nNumer telefonu: " + phone+ "\nAdres email: "+email;
//        emailService.sendEmail(to, subject, body);
//        return "Mail sent to: "+to;
//    }

    private static final String EMAIL_PATTERN = "^[A-Za-z0-9+_.-]+@(.+)$";
    private static final Pattern pattern = Pattern.compile(EMAIL_PATTERN);

    //TODO: Nie przyjmuje odpowiedzi w postaci wyjątków.
    @PostMapping("/send-email")
    public ResponseEntity<String> sendEmail(
            @RequestParam(value = "name") String name,
            @RequestParam(value = "phone") String phone,
            @RequestParam(value = "email") String email) {
        if (!isValidEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Niepoprawny adres email.");
        }

        try {
            String to = "m.wyr@o2.pl";
            String subject = "Potwierdzenie obecności.";
            String body = name + " potwierdził(a) obecność. \nNumer telefonu: " + phone + "\nAdres email: " + email;
            emailService.sendEmail(to, subject, body);
            return ResponseEntity.ok("Email został wysłany.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Wystąpił błąd podczas wysyłania emaila.");
        }
    }

    private boolean isValidEmail(String email) {
        return pattern.matcher(email).matches();
    }
}



