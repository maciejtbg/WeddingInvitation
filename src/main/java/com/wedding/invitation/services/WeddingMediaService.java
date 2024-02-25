package com.wedding.invitation.services;

import com.wedding.invitation.dtos.ImageUploadDto;
import com.wedding.invitation.models.UserAccount;
import com.wedding.invitation.models.WeddingMedia;
import com.wedding.invitation.repositories.UserAccountRepository;
import com.wedding.invitation.repositories.WeddingMediaRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
public class WeddingMediaService {
    @Bean
    private final SimpleDateFormat simpleDateFormat() {
        return new SimpleDateFormat("yyyyMMddHHmmss");
    }
    private final SimpleDateFormat simpleDateFormat;
    private static final String UPLOAD_DIR = "./src/main/resources/static/images/";
    private final UserAccountRepository userAccountRepository;
    private final WeddingMediaRepository weddingMediaRepository;

    @Autowired
    public WeddingMediaService(SimpleDateFormat simpleDateFormat, UserAccountRepository userAccountRepository, WeddingMediaRepository weddingMediaRepository) {
        this.simpleDateFormat = simpleDateFormat;
        this.userAccountRepository = userAccountRepository;
        this.weddingMediaRepository = weddingMediaRepository;
    }

    @Transactional
    public ResponseEntity<?> uploadImage(ImageUploadDto.ImageValues imageValuesUploadDto, @PathVariable String alias) throws IOException {
        String base64Image =  imageValuesUploadDto.getData();
        String outputFileName = null;
        if (base64Image!=null) {
            String base64ImageWithoutHeader = base64Image.split(",")[1];
            byte[] imageBytes = Base64.getDecoder().decode(base64ImageWithoutHeader);
            String fullPath = imageValuesUploadDto.getName();
            Path inputPath = Paths.get(fullPath);
            String fileName = inputPath.getFileName().toString();
            String formattedDate = simpleDateFormat.format(new Date());
            outputFileName = formattedDate+"_"+fileName;
            Path path = Path.of(UPLOAD_DIR,alias,outputFileName);
            Files.write(path, imageBytes);
            Optional<UserAccount> userAccount = userAccountRepository.findByAlias(alias);
            if (userAccount.isPresent()){
                Optional<WeddingMedia> weddingMediaOptional =weddingMediaRepository.findByUserAccount(userAccount.get());
                if (weddingMediaOptional.isPresent()){
                    WeddingMedia weddingMedia = weddingMediaOptional.get();
                    weddingMedia.setBackgroundTop(outputFileName);
                    weddingMediaRepository.save(weddingMedia);
                }
            }
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "Error occurred while uploading image"));
        } else {
            return ResponseEntity.ok(outputFileName);
        }
    }

}
