package com.wedding.invitation.services;

import com.wedding.invitation.models.Image;
import com.wedding.invitation.repositories.ImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class ImageService {
    private final ImageRepository imageGalleryRepository;

    @Autowired
    public ImageService(ImageRepository imageGalleryRepository) {
        this.imageGalleryRepository = imageGalleryRepository;
    }

    public void saveImage(Image imageGallery) {
        imageGalleryRepository.save(imageGallery);
    }

    public List<Image> getAllImages() {
        return imageGalleryRepository.findAll();
    }

    public Optional<Image> getImageById(Long id){
        return imageGalleryRepository.findById(id);
    }
}
