package com.wedding.invitation.services;

import com.wedding.invitation.models.Gallery;
import com.wedding.invitation.repositories.GalleryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GalleryService {
    private final GalleryRepository galleryRepository;

    public GalleryService(GalleryRepository galleryRepository) {
        this.galleryRepository = galleryRepository;
    }

    public List<Gallery> getAllGallery() {
        return galleryRepository.findAll();
    }
}
