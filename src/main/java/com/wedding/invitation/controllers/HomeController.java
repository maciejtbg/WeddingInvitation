package com.wedding.invitation.controllers;

import com.wedding.invitation.models.*;
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

    private final UserAccountService userAccountService;
    private final SimpleDateFormat simpleDateFormat;
    private final EmailService emailService;


    @Autowired
    public HomeController(UserAccountService userAccountService, SimpleDateFormat simpleDateFormat, EmailService emailService) {
        this.userAccountService = userAccountService;
        this.simpleDateFormat = simpleDateFormat;
        this.emailService = emailService;
    }

    @GetMapping("/{alias}")
    public String home(Model model, @PathVariable String alias) {
        Optional<UserAccount> userAccountOptional = userAccountService.getUserByAlias(alias);
        if (userAccountOptional.isPresent()) {
            UserAccount userAccount = userAccountOptional.get();
            String ceremonyDescription = userAccount.getWeddingDetails().getCeremonyDescription();
            String eventLocation = userAccount.getWeddingDetails().getCeremonyLocation();
            Date ceremonyDate = userAccount.getWeddingDetails().getCeremonyStartDate();
            Date weddingEnd = userAccount.getWeddingDetails().getWeddingPartyEndDate();
            PartnerDetails bride = userAccount.getPartnerDetails().get(0);
            PartnerDetails groom = userAccount.getPartnerDetails().get(1);
            WeddingDetails weddingDetails = userAccount.getWeddingDetails();
            WeddingStory weddingStory = userAccount.getWeddingStory();
            WeddingMedia weddingMedia = userAccount.getWeddingMedia();
            String eventTitle = "ŚLUB " + bride.getFirstName() + "&" + groom.getFirstName();


            model.addAttribute("alias",alias);
            model.addAttribute("eventTitle", eventTitle);
            model.addAttribute("ceremonyStartObject", ceremonyDate);
            model.addAttribute("ceremonyEndObject", weddingDetails.getCeremonyEndDate());
            model.addAttribute("weddingPartyStartObject", weddingDetails.getWeddingPartyStartDate());
            model.addAttribute("weddingPartyEndObject", weddingEnd);
            model.addAttribute("weddingLocation", eventLocation);
            model.addAttribute("groomName", groom.getFirstName());
            model.addAttribute("brideName", bride.getFirstName());
            model.addAttribute("groomLastName", groom.getLastName());
            model.addAttribute("brideLastName", bride.getLastName());
            model.addAttribute("groomDescription", groom.getDescription());
            model.addAttribute("brideDescription", bride.getDescription());
            model.addAttribute("ceremonyDescription", ceremonyDescription);
            model.addAttribute("weddingPartyDescription", weddingDetails.getWeddingPartyDescription());
            model.addAttribute("saveDateLink", generateGoogleCalendarLink(eventTitle, ceremonyDescription, eventLocation, ceremonyDate, weddingEnd));
            simpleDateFormat.applyPattern("dd MMMM yyyy");
            model.addAttribute("dateAndPlace", simpleDateFormat.format(weddingDetails.getCeremonyStartDate()) + " r., " + weddingDetails.getCeremonyLocation());
            model.addAttribute("shortLoveStory", weddingStory.getShortLoveStory());
            model.addAttribute("eventList", weddingStory.getEvents());
            model.addAttribute("weddingInvitedGuests", weddingStory.getWeddingInvitedGuests());
            model.addAttribute("weddingConfirmedGuests", weddingStory.getWeddingConfirmedGuests());
            model.addAttribute("eventsDoneInThisPlace", weddingStory.getEventsDoneInThisPlace());
            model.addAttribute("hoursSpentOnPreparing", weddingStory.getHoursSpentOnPreparing());
            model.addAttribute("wishList", weddingStory.getWishes());
            model.addAttribute("facilityList", weddingDetails.getFacilities());
            model.addAttribute("backgroundTop", userAccount.getWeddingMedia().getBackgroundTop());
            model.addAttribute("groomImage", userAccount.getWeddingMedia().getGroomImage());
            model.addAttribute("brideImage", weddingMedia.getBrideImage());
            model.addAttribute("backgroundMiddle", weddingMedia.getBackgroundMiddle());
            model.addAttribute("backgroundNumbers", weddingMedia.getBackgroundNumbers());
            model.addAttribute("backgroundBottom", weddingMedia.getBackgroundBottom());
            model.addAttribute("videoUrl", weddingMedia.getVideoUrl());
            model.addAttribute("videoThumbnail", weddingMedia.getVideoThumbnail());
//            model.addAttribute("imageList", imageService.getAllImages());
            model.addAttribute("galleryList", weddingMedia.getGalleries());
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



