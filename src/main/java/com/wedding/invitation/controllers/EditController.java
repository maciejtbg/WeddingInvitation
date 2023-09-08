package com.wedding.invitation.controllers;

import com.wedding.invitation.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;
import java.text.SimpleDateFormat;

@Controller
@RequestMapping()
public class EditController {

    private final EventService eventService;
    private final WishService wishService;
    private final FacilityService facilityService;
    private final ImageService imageService;
    private final GalleryService galleryService;

    private final SimpleDateFormat simpleDateFormat;


    @Autowired
    public EditController(EventService eventService, WishService wishService, FacilityService facilityService, ImageService imageGalleryService, GalleryService galleryService, SimpleDateFormat simpleDateFormat) {
        this.eventService = eventService;
        this.wishService = wishService;
        this.facilityService = facilityService;
        this.imageService = imageGalleryService;
        this.galleryService = galleryService;
        this.simpleDateFormat = simpleDateFormat;
    }
    @GetMapping("/edit")
    public String edit (Model model) {
        return "edit";
    }

    @PostMapping("/edit")
    @ResponseBody
    public String addDate(@RequestParam("weddingDate") String weddingDate){
        System.out.println(weddingDate);
        simpleDateFormat.applyPattern("dd.MM.yyyy HH:mm");
        try {
            System.out.println(simpleDateFormat.parse(weddingDate));
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }

        return weddingDate;
//        return "redirect:/";
    }
}
