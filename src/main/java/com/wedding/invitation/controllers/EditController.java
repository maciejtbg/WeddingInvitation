package com.wedding.invitation.controllers;

import com.wedding.invitation.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping()
public class EditController {

    private final EventService eventService;
    private final WishService wishService;
    private final FacilityService facilityService;
    private final ImageService imageService;
    private final GalleryService galleryService;


    @Autowired
    public EditController(EventService eventService, WishService wishService, FacilityService facilityService, ImageService imageGalleryService, GalleryService galleryService) {
        this.eventService = eventService;
        this.wishService = wishService;
        this.facilityService = facilityService;
        this.imageService = imageGalleryService;
        this.galleryService = galleryService;
    }
    @GetMapping("/edit")
    public String edit (Model model) {
        return "edit";
    }
}
