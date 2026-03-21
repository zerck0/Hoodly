package com.hoodly.hoodlydesktop.controllers;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;

public class LoginController {

    @FXML
    private Button loginButton;

    @FXML
    private Label statusLabel;

    @FXML
    private void handleLogin() {
        loginButton.setDisable(true);
        statusLabel.setText("Ouverture du navigateur...");
    }
}