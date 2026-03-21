package com.hoodly.hoodlydesktop;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class App extends Application {

    @Override
    public void start(Stage stage) throws IOException {
        FXMLLoader fxmlLoader = new FXMLLoader(
                App.class.getResource("/com/hoodly/hoodlydesktop/views/login.fxml")
        );
        Scene scene = new Scene(fxmlLoader.load(), 680, 800);
        scene.getStylesheets().add(
                App.class.getResource("/com/hoodly/hoodlydesktop/styles/main.css").toExternalForm()
        );
        stage.setTitle("HOODLY");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();
    }
}