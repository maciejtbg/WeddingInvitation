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

    private final UsersService usersService;

    private final SimpleDateFormat simpleDateFormat;





    @Autowired
    public HomeController(EventService eventService, WishService wishService, FacilityService facilityService, ImageService imageGalleryService, GalleryService galleryService, UsersService usersService, SimpleDateFormat simpleDateFormat) {
        this.eventService = eventService;
        this.wishService = wishService;
        this.facilityService = facilityService;
        this.imageService = imageGalleryService;
        this.galleryService = galleryService;
        this.usersService = usersService;
        this.simpleDateFormat = simpleDateFormat;
    }

    @GetMapping("/home")
    public String home(Model model, @RequestParam("id") long id){




//        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd'T'HHmmss");

//        String saveDateLink = "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+eventSubject+"&details="+eventDescription+"%20text&dates="+formattedWeddingStartDate+"/"+formattedWeddingEndDate+"&location="+weddingLocation;




        if (usersService.getUserById(id).isPresent()){
//            simpleDateFormat.applyPattern("yyyyMMdd'T'HHmmss");
            //TODO {Tu trzeba naprawić wymgania co do obiektu dany dla countera i informacji}
            model.addAttribute("ceremonyStartDate",usersService.getUserById(id).get().getCeremonyStartDate());

            simpleDateFormat.applyPattern("HH:mm");
            model.addAttribute("ceremonyEndDate",simpleDateFormat.format(usersService.getUserById(id).get().getCeremonyStartDate()));
            model.addAttribute("weddingPartyStartDate",simpleDateFormat.format(usersService.getUserById(id).get().getCeremonyStartDate()));
            model.addAttribute("weddingPartyEndDate",simpleDateFormat.format(usersService.getUserById(id).get().getCeremonyStartDate()));

            model.addAttribute("weddingLocation",usersService.getUserById(id).get().getCeremonyLocation());
            model.addAttribute("groomName",usersService.getUserById(id).get().getGroomName());
            model.addAttribute("brideName",usersService.getUserById(id).get().getBrideName());
            model.addAttribute("groomLastName",usersService.getUserById(id).get().getGroomLastName());
            model.addAttribute("brideLastName",usersService.getUserById(id).get().getBrideLastName());
            model.addAttribute("groomDescription",usersService.getUserById(id).get().getGroomDescription());
            model.addAttribute("brideDescription",usersService.getUserById(id).get().getBrideDescription());
            simpleDateFormat.applyPattern("yyyyMMdd'T'HHmmss");
            model.addAttribute("saveDateLink",usersService.getUserById(id).get().getSaveDateLink());
            simpleDateFormat.applyPattern("dd MMMM yyyy");
            model.addAttribute("dateAndPlace",simpleDateFormat.format(usersService.getUserById(id).get().getCeremonyStartDate())+" r., "+usersService.getUserById(id).get().getCeremonyLocation());
            model.addAttribute("shortLoveStory",usersService.getUserById(id).get().getShortLoveStory());
            model.addAttribute("eventList",eventService.getAllEvents());
            model.addAttribute("weddingInvitedGuests",usersService.getUserById(id).get().getWeddingInvitedGuests());
            model.addAttribute("weddingConfirmedGuests",usersService.getUserById(id).get().getWeddingConfirmedGuests());
            model.addAttribute("eventsDoneInThisPlace",usersService.getUserById(id).get().getEventsDoneInThisPlace());
            model.addAttribute("hoursSpentOnPreparing",usersService.getUserById(id).get().getHoursSpentOnPreparing());
            model.addAttribute("wishList",wishService.getAllWishes());
            model.addAttribute("facilityList",facilityService.getAllFacilities());
            model.addAttribute("videoUrl",usersService.getUserById(id).get().getVideoUrl());
            model.addAttribute("videoThumbnail",usersService.getUserById(id).get().getVideoThumbnail());
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
        return "<img src="+imageGallery.getImageUrl()+">";
        } else {
            return "Not found";
        }

    }
}

