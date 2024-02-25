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
//cała klasa ImageUploadDto przydaje się, gdy zdjęcie wysyłamy w formularzu bez wykorzystania AJAX
    //
    private String image;
    private String image_values;

    @Override
    public String toString() {
        return "ImageUploadDto{" +
                "image='" + image + '\'' +
                ", imageValues='" + image_values + '\'' +
                '}';
    }

    @Getter
    @Setter
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ImageValues {
        private String data;
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
