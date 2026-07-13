package com.circus.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.circus")
public class AutoDramaStudioApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoDramaStudioApplication.class, args);
    }
}
