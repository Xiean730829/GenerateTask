package com.circus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Application root for the modular monolith.
 *
 * <p>Keeping this class at {@code com.circus} makes Spring Boot component scanning and test
 * configuration discovery cover every bounded-context package below it.
 */
@SpringBootApplication
public class AutoDramaStudioApplication {

    public static void main(String[] args) {
        SpringApplication.run(AutoDramaStudioApplication.class, args);
    }
}
