package com.wedding.invitation.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

@Controller
@RequestMapping("/home")
public class HomeController {

    @GetMapping()
    public String home(Model model){

        String groomName = "Józef";
        String brideName = "Maria";
        String weddingLocation = "Tarnobrzeg";
        String eventSubject = brideName+"%20&%20"+groomName;
        String eventDescription = "Najlepszy ślub na świecie!";
        eventDescription = eventDescription.replace(" ","%20");




        //TODO {Zaimplementować pobieranie czasu z bazy danych}.
        Calendar calendar = Calendar.getInstance();

//        calendar.set(2023, Calendar.AUGUST, 26, 12, 0, 0);
        calendar.add(Calendar.HOUR_OF_DAY,1);
        Date weddingStartDate = calendar.getTime();
        int weddingDuration = 12;
        calendar.add(Calendar.HOUR,weddingDuration);
        Date weddingEndDate = calendar.getTime();

        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyyMMdd'T'HHmmss");
        String formattedWeddingStartDate = dateFormat.format(weddingStartDate);
        String formattedWeddingEndDate = dateFormat.format(weddingEndDate);

        String saveDateLink = "https://calendar.google.com/calendar/render?action=TEMPLATE&text="+eventSubject+"&details="+eventDescription+"%20text&dates="+formattedWeddingStartDate+"/"+formattedWeddingEndDate+"&location="+weddingLocation;




        model.addAttribute("weddingStartDate",weddingStartDate);
        model.addAttribute("weddingLocation",weddingLocation);
        model.addAttribute("groomName",groomName);
        model.addAttribute("brideName",brideName);
        model.addAttribute("saveDateLink",saveDateLink);
        return "index";
    }
}
