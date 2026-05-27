package com.hoodly.hoodlydesktop.controllers;

import com.hoodly.hoodlydesktop.AppContext;
import com.hoodly.hoodlydesktop.AppVersion;
import com.hoodly.hoodlydesktop.auth.TokenStore;
import com.hoodly.hoodlydesktop.services.ThemeManager;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.models.Incident;
import com.hoodly.hoodlydesktop.services.ApiClient;
import com.hoodly.hoodlydesktop.services.NetworkMonitor;
import com.hoodly.hoodlydesktop.services.SyncService;
import javafx.application.Platform;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.fxml.FXML;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.scene.chart.*;
import javafx.scene.control.*;
import javafx.scene.control.cell.PropertyValueFactory;
import javafx.scene.control.RadioButton;
import javafx.scene.control.ToggleGroup;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.HBox;
import javafx.scene.layout.StackPane;
import javafx.scene.layout.VBox;
import javafx.stage.FileChooser;
import javafx.stage.Stage;

import java.io.FileWriter;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.Locale;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DashboardController {

    @FXML private Label adminNameLabel;
    @FXML private Label connectionStatus;
    @FXML private Label pageTitle;
    @FXML private Label openIncidentsCount;
    @FXML private Label inProgressCount;
    @FXML private Label resolvedCount;
    @FXML private Label syncPendingCount;

    @FXML private VBox incidentsPane;
    @FXML private VBox statsPane;

    @FXML private TableView<Incident> incidentsTable;
    @FXML private TableColumn<Incident, String> typeCol;
    @FXML private TableColumn<Incident, String> descCol;
    @FXML private TableColumn<Incident, String> statutCol;
    @FXML private TableColumn<Incident, String> prioriteCol;
    @FXML private TableColumn<Incident, String> dateCol;
    @FXML private TableColumn<Incident, Void> actionsCol;

    @FXML private PieChart statutChart;
    @FXML private BarChart<String, Number> typeChart;
    @FXML private BarChart<String, Number> participationChart;

    @FXML private VBox pluginsPane;
    @FXML private VBox analysePane;
    @FXML private VBox calendrierPane;
    @FXML private BarChart<String, Number> jourSemaineChart;
    @FXML private BarChart<String, Number> evolutionChart;
    @FXML private GridPane calendrierGrid;
    @FXML private Label calendrierTitle;

    private final XYChart.Series<String, Number> jourSemaineSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> evolutionSeries   = new XYChart.Series<>();
    private YearMonth currentMonth = YearMonth.now();

    @FXML private VBox settingsPane;
    @FXML private RadioButton themeBleu;
    @FXML private RadioButton themeSombre;
    @FXML private RadioButton themeVert;
    @FXML private RadioButton fontSmall;
    @FXML private RadioButton fontNormal;
    @FXML private RadioButton fontLarge;
    @FXML private RadioButton layoutNormal;
    @FXML private RadioButton layoutCompact;

    private final ToggleGroup themeGroup  = new ToggleGroup();
    private final ToggleGroup fontGroup   = new ToggleGroup();
    private final ToggleGroup layoutGroup = new ToggleGroup();

    private final XYChart.Series<String, Number> typeSeries = new XYChart.Series<>();
    private final XYChart.Series<String, Number> participationSeries = new XYChart.Series<>();

    private static final String[] BAR_COLORS = {
        "#1E3A8A", "#2563EB", "#10B981", "#F59E0B", "#EF4444",
        "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#06B6D4"
    };

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

        adminNameLabel.setText("Modérateur");

        typeCol.setCellValueFactory(new PropertyValueFactory<>("type"));
        descCol.setCellValueFactory(new PropertyValueFactory<>("description"));
        statutCol.setCellValueFactory(new PropertyValueFactory<>("statut"));
        prioriteCol.setCellValueFactory(new PropertyValueFactory<>("priorite"));
        dateCol.setCellValueFactory(new PropertyValueFactory<>("createdAt"));
        setupActionsColumn();
        setupSettingsPanel();

        typeSeries.setName("Incidents");
        participationSeries.setName("Incidents signalés");
        jourSemaineSeries.setName("Incidents");
        evolutionSeries.setName("Incidents");
        ObservableList<XYChart.Series<String, Number>> jourData = FXCollections.observableArrayList();
        jourData.add(jourSemaineSeries);
        jourSemaineChart.setData(jourData);
        ObservableList<XYChart.Series<String, Number>> evoData = FXCollections.observableArrayList();
        evoData.add(evolutionSeries);
        evolutionChart.setData(evoData);
        ObservableList<XYChart.Series<String, Number>> typeData = FXCollections.observableArrayList();
        typeData.add(typeSeries);
        typeChart.setData(typeData);
        ObservableList<XYChart.Series<String, Number>> participationData = FXCollections.observableArrayList();
        participationData.add(participationSeries);
        participationChart.setData(participationData);

        updateConnectionStatus(networkMonitor.isOnline());
        networkMonitor.addListener(online -> {
            updateConnectionStatus(online);
            loadIncidents();
        });

        syncService.addOnSyncCompleteListener(this::loadIncidents);

        new Thread(() -> {
            if (ctx.getZoneId() == null) {
                try {
                    String zoneId = apiClient.fetchZoneId();
                    ctx.setZoneId(zoneId);
                } catch (Exception ignored) {}
            }
            Platform.runLater(this::loadIncidents);
        }).start();

        checkForUpdates();
    }

    private void loadIncidents() {
        new Thread(() -> {
            List<Incident> incidents = apiClient.getIncidents(AppContext.getInstance().getZoneId());
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

    private void setupActionsColumn() {
        actionsCol.setCellFactory(col -> new TableCell<>() {
            private final Button btnEnCours = new Button("En cours");
            private final Button btnResolu = new Button("Résolu");
            private final HBox box = new HBox(6, btnEnCours, btnResolu);

            {
                btnEnCours.setOnAction(e -> changeStatut(getTableView().getItems().get(getIndex()), "en_cours"));
                btnResolu.setOnAction(e -> changeStatut(getTableView().getItems().get(getIndex()), "resolu"));
            }

            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty || getIndex() < 0) {
                    setGraphic(null);
                    return;
                }
                Incident incident = getTableView().getItems().get(getIndex());
                String statut = incident.getStatut();
                btnEnCours.setDisable("en_cours".equals(statut) || "resolu".equals(statut));
                btnResolu.setDisable("resolu".equals(statut));
                setGraphic(box);
            }
        });
    }

    private void changeStatut(Incident incident, String newStatut) {
        incidentDao.updateStatutOffline(incident.getId(), newStatut);
        if ("pending_create".equals(incident.getSyncStatus())) {
            loadIncidents();
            return;
        }
        new Thread(() -> {
            try {
                apiClient.patchIncidentStatut(incident.getId(), newStatut);
                incidentDao.markSynced(incident.getId());
            } catch (Exception ignored) {}
            Platform.runLater(this::loadIncidents);
        }).start();
    }

    // ── NAVIGATION PLUGINS ──────────────────────────────────────────────────

    private void showPane(VBox pane) {
        for (VBox p : new VBox[]{incidentsPane, statsPane, pluginsPane, analysePane, calendrierPane, settingsPane}) {
            p.setVisible(false); p.setManaged(false);
        }
        pane.setVisible(true); pane.setManaged(true);
    }

    @FXML private void showPlugins() { showPane(pluginsPane); }

    // ── EXPORT CSV ──────────────────────────────────────────────────────────

    @FXML
    private void exportCsv() {
        FileChooser chooser = new FileChooser();
        chooser.setTitle("Exporter les incidents");
        chooser.setInitialFileName("incidents_export.csv");
        chooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("CSV", "*.csv"));
        java.io.File file = chooser.showSaveDialog(pluginsPane.getScene().getWindow());
        if (file == null) return;

        List<Incident> incidents = incidentDao.findAll();
        try (FileWriter fw = new FileWriter(file)) {
            fw.write("id,type,description,statut,priorite,signaledPar,createdAt\n");
            for (Incident i : incidents) {
                fw.write(String.join(",",
                    safe(i.getId()), safe(i.getType()), "\"" + safe(i.getDescription()) + "\"",
                    safe(i.getStatut()), safe(i.getPriorite()), safe(i.getSignaledPar()), safe(i.getCreatedAt())
                ) + "\n");
            }
            showAlert("Export réussi", incidents.size() + " incidents exportés vers " + file.getName());
        } catch (Exception e) {
            showAlert("Erreur", "Impossible d'exporter : " + e.getMessage());
        }
    }

    private String safe(String s) { return s != null ? s : ""; }

    private void showAlert(String title, String msg) {
        Platform.runLater(() -> {
            Alert alert = new Alert(Alert.AlertType.INFORMATION);
            alert.setTitle(title);
            alert.setHeaderText(null);
            alert.setContentText(msg);
            alert.showAndWait();
        });
    }

    // ── ANALYSE SOCIALE ─────────────────────────────────────────────────────

    @FXML
    private void showAnalyseSociale() {
        showPane(analysePane);
        new Thread(() -> {
            List<Incident> incidents = incidentDao.findAll();
            Platform.runLater(() -> loadAnalyseSociale(incidents));
        }).start();
    }

    private void loadAnalyseSociale(List<Incident> incidents) {
        String[] jours = {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"};
        long[] counts = new long[7];
        for (Incident i : incidents) {
            if (i.getCreatedAt() == null) continue;
            try {
                LocalDate date = LocalDate.parse(i.getCreatedAt().substring(0, 10));
                counts[date.getDayOfWeek().getValue() - 1]++;
            } catch (Exception ignored) {}
        }
        ObservableList<XYChart.Data<String, Number>> jourPoints = FXCollections.observableArrayList();
        for (int j = 0; j < 7; j++) jourPoints.add(new XYChart.Data<>(jours[j], counts[j]));
        jourSemaineSeries.getData().setAll(jourPoints);
        applyColors(jourSemaineSeries);

        // Évolution sur 6 mois
        ObservableList<XYChart.Data<String, Number>> evoPoints = FXCollections.observableArrayList();
        for (int m = 5; m >= 0; m--) {
            YearMonth ym = YearMonth.now().minusMonths(m);
            String label = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.FRENCH) + " " + ym.getYear();
            long count = incidents.stream().filter(i -> {
                if (i.getCreatedAt() == null) return false;
                try { return LocalDate.parse(i.getCreatedAt().substring(0, 10)).getMonth() == ym.getMonth()
                        && LocalDate.parse(i.getCreatedAt().substring(0, 10)).getYear() == ym.getYear();
                } catch (Exception e) { return false; }
            }).count();
            evoPoints.add(new XYChart.Data<>(label, count));
        }
        evolutionSeries.getData().setAll(evoPoints);
        applyColors(evolutionSeries);
    }

    // ── CALENDRIER ──────────────────────────────────────────────────────────

    @FXML private void showCalendrier() { showPane(calendrierPane); buildCalendrier(); }
    @FXML private void prevMonth() { currentMonth = currentMonth.minusMonths(1); buildCalendrier(); }
    @FXML private void nextMonth() { currentMonth = currentMonth.plusMonths(1); buildCalendrier(); }

    private void buildCalendrier() {
        calendrierTitle.setText("Calendrier — " +
                currentMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.FRENCH) + " " + currentMonth.getYear());
        calendrierGrid.getChildren().clear();

        String[] headers = {"Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"};
        for (int c = 0; c < 7; c++) {
            Label h = new Label(headers[c]);
            h.setStyle("-fx-font-weight: bold; -fx-min-width: 48; -fx-alignment: center;");
            calendrierGrid.add(h, c, 0);
        }

        List<Incident> incidents = incidentDao.findAll();
        LocalDate first = currentMonth.atDay(1);
        int startCol = first.getDayOfWeek().getValue() - 1;
        int daysInMonth = currentMonth.lengthOfMonth();

        for (int day = 1; day <= daysInMonth; day++) {
            LocalDate date = currentMonth.atDay(day);
            final LocalDate fd = date;
            long count = incidents.stream().filter(i -> {
                if (i.getCreatedAt() == null) return false;
                try { return LocalDate.parse(i.getCreatedAt().substring(0, 10)).equals(fd); }
                catch (Exception e) { return false; }
            }).count();

            StackPane cell = new StackPane();
            cell.setMinSize(48, 48);
            String bg = count == 0 ? "#F1F5F9" : count == 1 ? "#BFDBFE" : count <= 3 ? "#3B82F6" : "#1E3A8A";
            String fg = count >= 2 ? "white" : "#1E293B";
            cell.setStyle("-fx-background-color: " + bg + "; -fx-background-radius: 8;");
            Label lbl = new Label(String.valueOf(day));
            lbl.setStyle("-fx-text-fill: " + fg + "; -fx-font-size: 13px;");
            if (count > 0) {
                Label cnt = new Label("(" + count + ")");
                cnt.setStyle("-fx-text-fill: " + fg + "; -fx-font-size: 9px;");
                VBox box = new VBox(1, lbl, cnt);
                box.setStyle("-fx-alignment: center;");
                cell.getChildren().add(box);
            } else {
                cell.getChildren().add(lbl);
            }

            int col = (startCol + day - 1) % 7;
            int row = (startCol + day - 1) / 7 + 1;
            calendrierGrid.add(cell, col, row);
        }
    }

    private void setupSettingsPanel() {
        themeBleu.setToggleGroup(themeGroup);
        themeSombre.setToggleGroup(themeGroup);
        themeVert.setToggleGroup(themeGroup);
        fontSmall.setToggleGroup(fontGroup);
        fontNormal.setToggleGroup(fontGroup);
        fontLarge.setToggleGroup(fontGroup);
        layoutNormal.setToggleGroup(layoutGroup);
        layoutCompact.setToggleGroup(layoutGroup);

        ThemeManager tm = AppContext.getInstance().getThemeManager();
        switch (tm.getTheme()) {
            case ThemeManager.THEME_SOMBRE -> themeSombre.setSelected(true);
            case ThemeManager.THEME_VERT   -> themeVert.setSelected(true);
            default                        -> themeBleu.setSelected(true);
        }
        switch (tm.getFont()) {
            case ThemeManager.FONT_SMALL -> fontSmall.setSelected(true);
            case ThemeManager.FONT_LARGE -> fontLarge.setSelected(true);
            default                      -> fontNormal.setSelected(true);
        }
        if (ThemeManager.LAYOUT_COMPACT.equals(tm.getLayout())) layoutCompact.setSelected(true);
        else layoutNormal.setSelected(true);
    }

    @FXML
    private void showSettings() { showPane(settingsPane); }

    @FXML
    private void applySettings() {
        String theme  = themeSombre.isSelected() ? ThemeManager.THEME_SOMBRE
                      : themeVert.isSelected()   ? ThemeManager.THEME_VERT
                      : ThemeManager.THEME_BLEU;
        String font   = fontSmall.isSelected() ? ThemeManager.FONT_SMALL
                      : fontLarge.isSelected() ? ThemeManager.FONT_LARGE
                      : ThemeManager.FONT_NORMAL;
        String layout = layoutCompact.isSelected() ? ThemeManager.LAYOUT_COMPACT : ThemeManager.LAYOUT_NORMAL;

        ThemeManager tm = AppContext.getInstance().getThemeManager();
        tm.saveTheme(theme, font, layout);
        tm.applyTo(settingsPane.getScene());
    }

    @FXML
    private void showIncidents() {
        showPane(incidentsPane);
        pageTitle.setText("Gestion des incidents");
        loadIncidents();
    }

    @FXML
    private void showStats() {
        showPane(statsPane);
        new Thread(() -> {
            List<Incident> incidents = incidentDao.findAll();
            Platform.runLater(() -> loadStats(incidents));
        }).start();
    }

    private void loadStats(List<Incident> incidents) {
        // PieChart — répartition par statut
        statutChart.setData(FXCollections.observableArrayList(
            new PieChart.Data("Signalé", incidents.stream().filter(i -> "signale".equals(i.getStatut())).count()),
            new PieChart.Data("En cours", incidents.stream().filter(i -> "en_cours".equals(i.getStatut())).count()),
            new PieChart.Data("Résolu", incidents.stream().filter(i -> "resolu".equals(i.getStatut())).count())
        ));

        // BarChart — incidents par type (même series, on remplace juste les données)
        Map<String, Long> byType = incidents.stream()
            .filter(i -> i.getType() != null)
            .collect(Collectors.groupingBy(Incident::getType, Collectors.counting()));
        ObservableList<XYChart.Data<String, Number>> typePoints = FXCollections.observableArrayList();
        byType.forEach((type, count) -> typePoints.add(new XYChart.Data<>(type, count)));
        typeSeries.getData().setAll(typePoints);
        applyColors(typeSeries);

        // BarChart — participation des voisins (top 10 signaleurs)
        Map<String, Long> bySignaleur = incidents.stream()
            .filter(i -> i.getSignaledPar() != null && !i.getSignaledPar().isEmpty())
            .collect(Collectors.groupingBy(Incident::getSignaledPar, Collectors.counting()));
        ObservableList<XYChart.Data<String, Number>> participationPoints = FXCollections.observableArrayList();
        bySignaleur.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .forEach(e -> participationPoints.add(new XYChart.Data<>(e.getKey(), e.getValue())));
        participationSeries.getData().setAll(participationPoints);
        applyColors(participationSeries);
    }

    private void applyColors(XYChart.Series<String, Number> series) {
        for (int i = 0; i < series.getData().size(); i++) {
            final String color = BAR_COLORS[i % BAR_COLORS.length];
            XYChart.Data<String, Number> item = series.getData().get(i);
            if (item.getNode() != null) {
                item.getNode().setStyle("-fx-bar-fill: " + color + ";");
            } else {
                item.nodeProperty().addListener((obs, oldNode, newNode) -> {
                    if (newNode != null) newNode.setStyle("-fx-bar-fill: " + color + ";");
                });
            }
        }
    }

    // ── MISES À JOUR AUTOMATIQUES ────────────────────────────────────────────

    private void checkForUpdates() {
        new Thread(() -> {
            try {
                ApiClient.VersionInfo info = apiClient.checkVersion();
                if (isNewerVersion(info.version(), AppVersion.CURRENT)) {
                    Platform.runLater(() -> showUpdateDialog(info));
                }
            } catch (Exception ignored) {}
        }).start();
    }

    private boolean isNewerVersion(String remote, String current) {
        String[] r = remote.split("\\.");
        String[] c = current.split("\\.");
        for (int i = 0; i < Math.min(r.length, c.length); i++) {
            int diff = Integer.parseInt(r[i]) - Integer.parseInt(c[i]);
            if (diff != 0) return diff > 0;
        }
        return r.length > c.length;
    }

    private void showUpdateDialog(ApiClient.VersionInfo info) {
        Alert alert = new Alert(Alert.AlertType.CONFIRMATION);
        alert.setTitle("Mise à jour disponible");
        alert.setHeaderText("Version " + info.version() + " disponible (actuelle : " + AppVersion.CURRENT + ")");
        alert.setContentText("Voulez-vous télécharger et installer la mise à jour ?");
        alert.showAndWait().ifPresent(response -> {
            if (response == ButtonType.OK) downloadAndUpdate(info.downloadUrl());
        });
    }

    private void downloadAndUpdate(String downloadUrl) {
        Alert progress = new Alert(Alert.AlertType.INFORMATION);
        progress.setTitle("Mise à jour");
        progress.setHeaderText("Téléchargement en cours...");
        progress.setContentText("Veuillez patienter.");
        progress.show();

        new Thread(() -> {
            try {
                Path tempJar = Paths.get(System.getProperty("java.io.tmpdir"), "hoodly-update.jar");
                apiClient.downloadFile(downloadUrl, tempJar);

                URI location = DashboardController.class.getProtectionDomain().getCodeSource().getLocation().toURI();
                Path currentJar = Paths.get(location);
                boolean isJar = currentJar.toString().endsWith(".jar");
                String java = ProcessHandle.current().info().command().orElse("java");

                String os = System.getProperty("os.name").toLowerCase();
                if (os.contains("win")) {
                    Path script = Paths.get(System.getProperty("java.io.tmpdir"), "hoodly_update.bat");
                    String content = "@echo off\r\ntimeout /t 2 /nobreak > nul\r\n"
                            + (isJar ? "copy /y \"" + tempJar + "\" \"" + currentJar + "\"\r\n" : "")
                            + "start \"\" \"" + java + "\" -jar \"" + (isJar ? currentJar : tempJar) + "\"\r\n";
                    Files.writeString(script, content);
                    Runtime.getRuntime().exec(new String[]{"cmd", "/c", "start", "/min", script.toString()});
                } else {
                    Path script = Paths.get(System.getProperty("java.io.tmpdir"), "hoodly_update.sh");
                    String content = "#!/bin/bash\nsleep 2\n"
                            + (isJar ? "cp \"" + tempJar + "\" \"" + currentJar + "\"\n" : "")
                            + "\"" + java + "\" -jar \"" + (isJar ? currentJar : tempJar) + "\" &\n";
                    Files.writeString(script, content);
                    script.toFile().setExecutable(true);
                    Runtime.getRuntime().exec(new String[]{"bash", script.toString()});
                }

                Platform.runLater(() -> { progress.close(); Platform.exit(); });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    progress.close();
                    showAlert("Erreur", "Mise à jour impossible : " + e.getMessage());
                });
            }
        }).start();
    }

    @FXML
    private void handleUninstall() {
        Alert confirm = new Alert(Alert.AlertType.CONFIRMATION);
        confirm.setTitle("Désinstaller Hoodly");
        confirm.setHeaderText("Êtes-vous sûr de vouloir désinstaller l'application ?");
        confirm.setContentText("Toutes les données locales et le fichier .jar seront supprimés définitivement.");
        confirm.showAndWait().ifPresent(response -> {
            if (response != ButtonType.OK) return;
            try {
                Path dataDir = Paths.get(System.getProperty("user.home"), ".hoodly");
                URI location = DashboardController.class.getProtectionDomain().getCodeSource().getLocation().toURI();
                Path jarPath = Paths.get(location);
                boolean isJar = jarPath.toString().endsWith(".jar");

                String os = System.getProperty("os.name").toLowerCase();
                if (os.contains("win")) {
                    Path script = Paths.get(System.getProperty("java.io.tmpdir"), "hoodly_uninstall.bat");
                    String content = "@echo off\r\ntimeout /t 2 /nobreak > nul\r\n"
                            + (isJar ? "del /f \"" + jarPath + "\"\r\n" : "")
                            + "rmdir /s /q \"" + dataDir + "\"\r\n";
                    Files.writeString(script, content);
                    Runtime.getRuntime().exec(new String[]{"cmd", "/c", "start", "/min", script.toString()});
                } else {
                    Path script = Paths.get(System.getProperty("java.io.tmpdir"), "hoodly_uninstall.sh");
                    String content = "#!/bin/bash\nsleep 2\n"
                            + (isJar ? "rm -f \"" + jarPath + "\"\n" : "")
                            + "rm -rf \"" + dataDir + "\"\n";
                    Files.writeString(script, content);
                    script.toFile().setExecutable(true);
                    Runtime.getRuntime().exec(new String[]{"bash", script.toString()});
                }
                Platform.exit();
            } catch (Exception e) {
                showAlert("Erreur", "Désinstallation impossible : " + e.getMessage());
            }
        });
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
