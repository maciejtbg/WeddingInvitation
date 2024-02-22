package com.wedding.invitation.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ImageUploadDto {
    private String image; // Może być puste w twoim przypadku
    private String image_values; // Zmienione na String, aby przechowywać zserializowany JSON jako tekst

    @Override
    public String toString() {
        return "ImageUploadDto{" +
                "image='" + image + '\'' +
                ", imageValues='" + image_values + '\'' +
                '}';
    }

    // Klasa ImageValues pozostaje niezmieniona, ale teraz będziesz musiał ją deserializować ręcznie z wartości imageValues
    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageValues {
        private String data; // Zakładam, że to pole przechowuje dane obrazu w Base64, jeśli nie, usunąć lub zmodyfikować
        private String name;
        private int imageOriginalWidth;
        private int imageOriginalHeight;
        private int imageWidth;
        private int imageHeight;
        private int width;
        private int height;
        private int left;
        private int top;

        @Override
        public String toString() {
            return "ImageValues{" +
                    "data='" + data + '\'' +
                    ", name='" + name + '\'' +
                    ", imageOriginalWidth=" + imageOriginalWidth +
                    ", imageOriginalHeight=" + imageOriginalHeight +
                    ", imageWidth=" + imageWidth +
                    ", imageHeight=" + imageHeight +
                    ", width=" + width +
                    ", height=" + height +
                    ", left=" + left +
                    ", top=" + top +
                    '}';
        }
    }
}
