module com.hoodly.hoodlydesktop {
    requires javafx.controls;
    requires javafx.fxml;
    requires okhttp3;
    requires com.fasterxml.jackson.databind;
    requires java.desktop;
    requires java.sql;
    requires org.xerial.sqlitejdbc;

    opens com.hoodly.hoodlydesktop to javafx.fxml;
    opens com.hoodly.hoodlydesktop.controllers to javafx.fxml;
    opens com.hoodly.hoodlydesktop.auth to javafx.fxml;
    opens com.hoodly.hoodlydesktop.models to javafx.fxml, javafx.base, com.fasterxml.jackson.databind;
    opens com.hoodly.hoodlydesktop.services to javafx.fxml;
    opens com.hoodly.hoodlydesktop.db to javafx.fxml;

    exports com.hoodly.hoodlydesktop;
    exports com.hoodly.hoodlydesktop.db;
}