package com.wedding.invitation.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Calendar;
import java.util.Date;

@Controller
@RequestMapping()
public class HomeController {

    @GetMapping("/home")
    public String home(Model model){

        //TODO {Zaimplementować pobieranie czasu z bazy danych}.
        Calendar calendar = Calendar.getInstance();

//        calendar.set(2023, Calendar.AUGUST, 26, 12, 0, 0);
        calendar.add(Calendar.HOUR_OF_DAY,1);
        Date weddingDate = calendar.getTime();
        model.addAttribute("weddingDate",weddingDate);
        return "index";
    }
}
