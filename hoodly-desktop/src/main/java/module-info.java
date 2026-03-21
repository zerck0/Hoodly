module com.hoodly.hoodlydesktop {
    requires javafx.controls;
    requires javafx.fxml;

    opens com.hoodly.hoodlydesktop to javafx.fxml;
    opens com.hoodly.hoodlydesktop.controllers to javafx.fxml;

    exports com.hoodly.hoodlydesktop;
}