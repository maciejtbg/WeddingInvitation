package com.wedding.invitation.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Facility {
    @Id
    @GeneratedValue
    private long id;
    private String name;
    private String iconUrl;
    @Column(columnDefinition = "TEXT")
    private String content;

    public Facility(String name, String iconUrl, String content) {
        this.name = name;
        this.iconUrl = iconUrl;
        this.content = content;
    }
}
