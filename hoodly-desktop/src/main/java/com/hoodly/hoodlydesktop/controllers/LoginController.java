package com.hoodly.hoodlydesktop.controllers;

import com.hoodly.hoodlydesktop.auth.AuthService;
import javafx.application.Platform;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.control.Button;
import javafx.scene.control.Label;
import javafx.stage.Stage;

public class LoginController {

    @FXML private Button loginButton;
    @FXML private Label statusLabel;

    private final AuthService authService = new AuthService();

    @FXML
    private void handleLogin() {
        loginButton.setDisable(true);
        statusLabel.setText("Ouverture du navigateur...");

        authService.login(new AuthService.AuthCallback() {

            @Override
            public void onSuccess(String accessToken) {
                Platform.runLater(() -> {
                    try {
                        FXMLLoader loader = new FXMLLoader(
                                getClass().getResource(
                                        "/com/hoodly/hoodlydesktop/views/dashboard.fxml"
                                )
                        );
                        Scene scene = new Scene(loader.load(), 1100, 700);
                        scene.getStylesheets().add(
                                getClass().getResource(
                                        "/com/hoodly/hoodlydesktop/styles/main.css"
                                ).toExternalForm()
                        );
                        Stage stage = (Stage) loginButton.getScene().getWindow();
                        stage.setScene(scene);
                        stage.setResizable(true);
                        stage.setTitle("HOODLY — Dashboard");
                    } catch (Exception e) {
                        statusLabel.setText("Erreur : " + e.getMessage());
                        loginButton.setDisable(false);
                    }
                });
            }

            @Override
            public void onError(String message) {
                Platform.runLater(() -> {
                    statusLabel.setText("Erreur : " + message);
                    loginButton.setDisable(false);
                });
            }
        });
    }
}