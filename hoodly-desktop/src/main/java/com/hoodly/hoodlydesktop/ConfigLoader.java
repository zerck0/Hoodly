package com.hoodly.hoodlydesktop;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigLoader {

    private static ConfigLoader instance;
    private final Properties properties = new Properties();

    private ConfigLoader() {
        try (InputStream input = getClass().getResourceAsStream(
                "/com/hoodly/hoodlydesktop/config.properties")) {
            if (input == null) {
                throw new RuntimeException("config.properties introuvable");
            }
            properties.load(input);
        } catch (IOException e) {
            throw new RuntimeException("Erreur de chargement de la config : " + e.getMessage());
        }
    }

    public static ConfigLoader getInstance() {
        if (instance == null) {
            instance = new ConfigLoader();
        }
        return instance;
    }

    public String get(String key) {
        String value = properties.getProperty(key);
        if (value == null) {
            throw new RuntimeException("Clé introuvable dans config.properties : " + key);
        }
        return value;
    }
}