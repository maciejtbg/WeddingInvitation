package com.wedding.invitation.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wedding.invitation.dtos.ImageUploadDto;
import com.wedding.invitation.models.UserAccount;
import com.wedding.invitation.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.ModelAndView;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Base64;
import java.util.Optional;

@Controller
public class EditController {

    private final UserAccountService userAccountService;
    private final EventService eventService;
    private final WishService wishService;
    private final FacilityService facilityService;
    private final ImageService imageService;
    private final GalleryService galleryService;

    private final SimpleDateFormat simpleDateFormat;


    @Autowired
    public EditController(UserAccountService userAccountService, EventService eventService, WishService wishService, FacilityService facilityService, ImageService imageGalleryService, GalleryService galleryService, SimpleDateFormat simpleDateFormat) {
        this.userAccountService = userAccountService;
        this.eventService = eventService;
        this.wishService = wishService;
        this.facilityService = facilityService;
        this.imageService = imageGalleryService;
        this.galleryService = galleryService;
        this.simpleDateFormat = simpleDateFormat;
    }
    @GetMapping("/{alias}/edit")
    public String edit (Model model, @PathVariable String alias) {
        Optional<UserAccount> userAccountOptional = userAccountService.getUserByAlias(alias);
        if (userAccountOptional.isPresent()) {
            UserAccount userAccount = userAccountOptional.get();
            model.addAttribute("alias",alias);
            model.addAttribute("backgroundTop", userAccount.getWeddingMedia().getBackgroundTop());
            return "edit";
        }else {
            return null;
        }
    }
    private static final String UPLOAD_DIR = "./src/main/resources/static/images/";

    @ResponseBody
    @PostMapping(value = "{alias}/upload", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public String upload(ImageUploadDto imageUploadDto, @PathVariable String alias) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        ImageUploadDto.ImageValues imageValues = objectMapper.readValue(imageUploadDto.getImage_values(), ImageUploadDto.ImageValues.class);
        String base64ImageWithoutHeader = imageValues.getData().split(",")[1];
        // Dekodowanie base64 do tablicy bajtów
        byte[] imageBytes = Base64.getDecoder().decode(base64ImageWithoutHeader);

        System.out.println(imageValues.getName());
        // Zapis do pliku
        Path path = Paths.get(UPLOAD_DIR, alias, "POST_"+imageValues.getName()); //TODO{Problem ze ścieżkami jeśli podstawiam zdjęcie}
        Files.write(path, imageBytes);

        return "Obraz został pomyślnie przesłany";
    }










}
