module com.hoodly.hoodlydesktop {
    requires transitive javafx.controls;
    requires transitive javafx.fxml;
    requires okhttp3;
    requires com.fasterxml.jackson.databind;
    requires java.desktop;
    requires transitive java.sql;
    requires org.xerial.sqlitejdbc;

    opens com.hoodly.hoodlydesktop to javafx.fxml;
    opens com.hoodly.hoodlydesktop.controllers to javafx.fxml;
    opens com.hoodly.hoodlydesktop.auth to javafx.fxml;
    opens com.hoodly.hoodlydesktop.models to javafx.fxml, javafx.base, com.fasterxml.jackson.databind;
    opens com.hoodly.hoodlydesktop.services to javafx.fxml;
    opens com.hoodly.hoodlydesktop.db to javafx.fxml;

    exports com.hoodly.hoodlydesktop;
    exports com.hoodly.hoodlydesktop.db;
    exports com.hoodly.hoodlydesktop.models;
    exports com.hoodly.hoodlydesktop.services;
    exports com.hoodly.hoodlydesktop.auth;
}