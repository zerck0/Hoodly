package com.hoodly.hoodlydesktop.controllers;

import com.hoodly.hoodlydesktop.AppContext;
import com.hoodly.hoodlydesktop.auth.TokenStore;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.models.Incident;
import com.hoodly.hoodlydesktop.services.ApiClient;
import com.hoodly.hoodlydesktop.services.NetworkMonitor;
import com.hoodly.hoodlydesktop.services.SyncService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.stage.Stage;

import java.util.List;

public class DashboardController {

    @FXML private Label adminNameLabel;
    @FXML private Label connectionStatus;
    @FXML private Label pageTitle;
    @FXML private Label openIncidentsCount;
    @FXML private Label inProgressCount;
    @FXML private Label resolvedCount;
    @FXML private Label syncPendingCount;

    @FXML private TableView<Incident> incidentsTable;
    @FXML private TableColumn<Incident, String> typeCol;
    @FXML private TableColumn<Incident, String> descCol;
    @FXML private TableColumn<Incident, String> statutCol;
    @FXML private TableColumn<Incident, String> prioriteCol;
    @FXML private TableColumn<Incident, String> dateCol;

    private ApiClient apiClient;
    private IncidentDao incidentDao;
    private NetworkMonitor networkMonitor;
    private SyncService syncService;

    @FXML
    public void initialize() {
        AppContext ctx = AppContext.getInstance();
        apiClient = ctx.getApiClient();
        incidentDao = ctx.getIncidentDao();
        networkMonitor = ctx.getNetworkMonitor();
        syncService = ctx.getSyncService();

        adminNameLabel.setText("Administrateur");

        typeCol.setCellValueFactory(new PropertyValueFactory<>("type"));
        descCol.setCellValueFactory(new PropertyValueFactory<>("description"));
        statutCol.setCellValueFactory(new PropertyValueFactory<>("statut"));
        prioriteCol.setCellValueFactory(new PropertyValueFactory<>("priorite"));
        dateCol.setCellValueFactory(new PropertyValueFactory<>("createdAt"));

        updateConnectionStatus(networkMonitor.isOnline());
        networkMonitor.addListener(online -> {
            updateConnectionStatus(online);
            loadIncidents();
        });

        syncService.addOnSyncCompleteListener(this::loadIncidents);

        loadIncidents();
    }

    private void loadIncidents() {
        new Thread(() -> {
            List<Incident> incidents = apiClient.getIncidents();
            int pending = incidentDao.countPending();

            long open = incidents.stream().filter(i -> "signale".equals(i.getStatut())).count();
            long inProgress = incidents.stream().filter(i -> "en_cours".equals(i.getStatut())).count();
            long resolved = incidents.stream().filter(i -> "resolu".equals(i.getStatut())).count();

            Platform.runLater(() -> {
                incidentsTable.setItems(FXCollections.observableArrayList(incidents));
                openIncidentsCount.setText(String.valueOf(open));
                inProgressCount.setText(String.valueOf(inProgress));
                resolvedCount.setText(String.valueOf(resolved));
                syncPendingCount.setText(String.valueOf(pending));
            });
        }).start();
    }

    private void updateConnectionStatus(boolean online) {
        connectionStatus.setText(online ? "● En ligne" : "● Hors ligne");
    }

    @FXML
    private void showIncidents() {
        pageTitle.setText("Gestion des incidents");
        loadIncidents();
    }

    @FXML
    private void handleLogout() {
        TokenStore.getInstance().clear();
        try {
            FXMLLoader loader = new FXMLLoader(
                    getClass().getResource("/com/hoodly/hoodlydesktop/views/login.fxml")
            );
            Scene scene = new Scene(loader.load(), 480, 600);
            scene.getStylesheets().add(
                    getClass().getResource("/com/hoodly/hoodlydesktop/styles/main.css").toExternalForm()
            );
            Stage stage = (Stage) adminNameLabel.getScene().getWindow();
            stage.setScene(scene);
            stage.setResizable(false);
            stage.setTitle("HOODLY");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
