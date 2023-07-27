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
        String groomLastName = "Nowak";
        String brideName = "Maria";
        String brideLastName = "Kowalska";
        String groomDescription = "Za mglistymi osadami i wietrznymi wzgórzami, żyje wojownik samotny i gniewny. Już na moment, już za niedługo przyjdzie mu walczyć o rękę królewny.";
        String brideDescription = "Pośród starych lasów i srebrzystych strumieni, Panna Młoda w swej urodzie tkwi, jak ze snów wyjęta królewna, która czeka na swojego rycerza, by w miłości odnaleźć spokój i szczęście wieczne.";
        String weddingLocation = "Tarnobrzeg";
        String eventSubject = brideName+"%20&%20"+groomName;
        String eventDescription = "Najlepszy ślub na świecie!";
        eventDescription = eventDescription.replace(" ","%20");
        String shortLoveStory = "Gdzie trakty handlowe nie dochodzą, gdzie wiatry nie mają czego omijać, na mazurskiej dziewiczej ziemi, mieszkała niedaleko siebie para zakochanych nastolatków.";




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


        SimpleDateFormat longDateFormat = new SimpleDateFormat("dd MMMM yyyy");


        model.addAttribute("weddingStartDate",weddingStartDate);
        model.addAttribute("weddingLocation",weddingLocation);
        model.addAttribute("groomName",groomName);
        model.addAttribute("brideName",brideName);
        model.addAttribute("groomLastName",groomLastName);
        model.addAttribute("brideLastName",brideLastName);
        model.addAttribute("groomDescription",groomDescription);
        model.addAttribute("brideDescription",brideDescription);
        model.addAttribute("saveDateLink",saveDateLink);
        model.addAttribute("dateAndPlace",longDateFormat.format(weddingStartDate)+" r., "+weddingLocation);
        model.addAttribute("shortLoveStory",shortLoveStory);
        return "index";
    }
}
