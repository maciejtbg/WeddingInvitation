package com.wedding.invitation.controllers;

import com.wedding.invitation.models.Usr;
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

    private final UsrService usrService;
    private final SimpleDateFormat simpleDateFormat;
    private final EmailService emailService;


    @Autowired
    public HomeController(UsrService usrService, SimpleDateFormat simpleDateFormat, EmailService emailService) {
        this.usrService = usrService;
        this.simpleDateFormat = simpleDateFormat;
        this.emailService = emailService;
    }

    @GetMapping("/{alias}")
    public String home(Model model, @PathVariable String alias) {
        Optional<Usr> usrOptional = usrService.getUsrByAlias(alias);
        if (usrOptional.isPresent()) {
            Usr usr = usrOptional.get();
            String ceremonyDescription = usr.getCeremonyDescription();
            String eventLocation = usr.getCeremonyLocation();
            Date ceremonyDate = usr.getCeremonyStartDate();
            Date weddingEnd = usr.getWeddingPartyEndDate();
            String eventTitle = "ŚLUB " + usr.getBrideName() + "&" + usr.getGroomName();
            model.addAttribute("eventTitle", eventTitle);
            model.addAttribute("ceremonyStartObject", ceremonyDate);
            model.addAttribute("ceremonyEndObject", usr.getCeremonyEndDate());
            model.addAttribute("weddingPartyStartObject", usr.getWeddingPartyStartDate());
            model.addAttribute("weddingPartyEndObject", weddingEnd);
            model.addAttribute("weddingLocation", eventLocation);
            model.addAttribute("groomName", usr.getGroomName());
            model.addAttribute("brideName", usr.getBrideName());
            model.addAttribute("groomLastName", usr.getGroomLastName());
            model.addAttribute("brideLastName", usr.getBrideLastName());
            model.addAttribute("groomDescription", usr.getGroomDescription());
            model.addAttribute("brideDescription", usr.getBrideDescription());
            model.addAttribute("ceremonyDescription", ceremonyDescription);
            model.addAttribute("weddingPartyDescription", usr.getWeddingPartyDescription());
            model.addAttribute("saveDateLink", generateGoogleCalendarLink(eventTitle, ceremonyDescription, eventLocation, ceremonyDate, weddingEnd));
            simpleDateFormat.applyPattern("dd MMMM yyyy");
            model.addAttribute("dateAndPlace", simpleDateFormat.format(usr.getCeremonyStartDate()) + " r., " + usr.getCeremonyLocation());
            model.addAttribute("shortLoveStory", usr.getShortLoveStory());
            model.addAttribute("eventList", usr.getEvents());
            model.addAttribute("weddingInvitedGuests", usr.getWeddingInvitedGuests());
            model.addAttribute("weddingConfirmedGuests", usr.getWeddingConfirmedGuests());
            model.addAttribute("eventsDoneInThisPlace", usr.getEventsDoneInThisPlace());
            model.addAttribute("hoursSpentOnPreparing", usr.getHoursSpentOnPreparing());
            model.addAttribute("wishList", usr.getWishes());
            model.addAttribute("facilityList", usr.getFacilities());
            model.addAttribute("backgroundTop", usr.getBackgroundTop());
            model.addAttribute("groomImage", usr.getGroomImage());
            model.addAttribute("brideImage", usr.getBrideImage());
            model.addAttribute("backgroundMiddle", usr.getBackgroundMiddle());
            model.addAttribute("backgroundNumbers", usr.getBackgroundNumbers());
            model.addAttribute("backgroundBottom", usr.getBackgroundBottom());
            model.addAttribute("videoUrl", usr.getVideoUrl());
            model.addAttribute("videoThumbnail", usr.getVideoThumbnail());
//            model.addAttribute("imageList", imageService.getAllImages());
            model.addAttribute("galleryList", usr.getGalleries());
        }else {
            //TODO{Zachowanie w przypadku braku aliasu.}
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



