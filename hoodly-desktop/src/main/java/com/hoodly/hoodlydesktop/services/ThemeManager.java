package com.hoodly.hoodlydesktop.services;

import com.hoodly.hoodlydesktop.db.SettingsDao;
import javafx.scene.Scene;

public class ThemeManager {

    public static final String THEME_BLEU   = "bleu";
    public static final String THEME_SOMBRE = "sombre";
    public static final String THEME_VERT   = "vert";

    public static final String FONT_SMALL  = "small";
    public static final String FONT_NORMAL = "normal";
    public static final String FONT_LARGE  = "large";

    public static final String LAYOUT_NORMAL  = "normal";
    public static final String LAYOUT_COMPACT = "compact";

    private final SettingsDao settingsDao;

    public ThemeManager(SettingsDao settingsDao) {
        this.settingsDao = settingsDao;
    }

    public String getTheme()  { return settingsDao.get("theme",  THEME_BLEU); }
    public String getFont()   { return settingsDao.get("font",   FONT_NORMAL); }
    public String getLayout() { return settingsDao.get("layout", LAYOUT_NORMAL); }

    public void saveTheme(String theme, String font, String layout) {
        settingsDao.set("theme",  theme);
        settingsDao.set("font",   font);
        settingsDao.set("layout", layout);
    }

    public void applyTo(Scene scene) {
        scene.getStylesheets().removeIf(s -> s.contains("/styles/theme-"));
        scene.getStylesheets().removeIf(s -> s.contains("/styles/font-"));
        scene.getStylesheets().removeIf(s -> s.contains("/styles/layout-"));

        String themeCss = getClass().getResource(
                "/com/hoodly/hoodlydesktop/styles/theme-" + getTheme() + ".css"
        ).toExternalForm();
        scene.getStylesheets().add(themeCss);

        scene.getRoot().setStyle(getFontStyle());

        if (LAYOUT_COMPACT.equals(getLayout())) {
            scene.getRoot().getStyleClass().add("layout-compact");
        } else {
            scene.getRoot().getStyleClass().remove("layout-compact");
        }
    }

    private String getFontStyle() {
        return switch (getFont()) {
            case FONT_SMALL -> "-fx-font-size: 11px;";
            case FONT_LARGE -> "-fx-font-size: 15px;";
            default         -> "-fx-font-size: 13px;";
        };
    }
}
