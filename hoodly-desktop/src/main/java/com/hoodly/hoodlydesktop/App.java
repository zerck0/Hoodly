package com.hoodly.hoodlydesktop;

import com.hoodly.hoodlydesktop.auth.TokenStore;
import com.hoodly.hoodlydesktop.db.DatabaseManager;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.db.SettingsDao;
import com.hoodly.hoodlydesktop.db.TokenDao;
import com.hoodly.hoodlydesktop.services.ApiClient;
import com.hoodly.hoodlydesktop.services.NetworkMonitor;
import com.hoodly.hoodlydesktop.services.SyncService;
import com.hoodly.hoodlydesktop.services.ThemeManager;
import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.io.IOException;

public class App extends Application {

    @Override
    public void start(Stage stage) throws IOException {
        DatabaseManager db = DatabaseManager.getInstance();
        IncidentDao incidentDao = new IncidentDao(db);
        TokenDao tokenDao = new TokenDao(db);

        TokenStore.getInstance().setTokenDao(tokenDao);

        ApiClient apiClient = new ApiClient(incidentDao);
        NetworkMonitor networkMonitor = new NetworkMonitor();
        SyncService syncService = new SyncService(apiClient, incidentDao);

        SettingsDao settingsDao = new SettingsDao(db);
        ThemeManager themeManager = new ThemeManager(settingsDao);

        AppContext ctx = AppContext.getInstance();
        ctx.setDatabaseManager(db);
        ctx.setIncidentDao(incidentDao);
        ctx.setTokenDao(tokenDao);
        ctx.setApiClient(apiClient);
        ctx.setNetworkMonitor(networkMonitor);
        ctx.setSyncService(syncService);
        ctx.setSettingsDao(settingsDao);
        ctx.setThemeManager(themeManager);

        networkMonitor.addListener(online -> {
            if (online) syncService.syncNow();
        });
        networkMonitor.start();

        FXMLLoader fxmlLoader = new FXMLLoader(
                App.class.getResource("/com/hoodly/hoodlydesktop/views/login.fxml")
        );
        Scene scene = new Scene(fxmlLoader.load(), 680, 800);
        scene.getStylesheets().add(
                App.class.getResource("/com/hoodly/hoodlydesktop/styles/main.css").toExternalForm()
        );
        themeManager.applyTo(scene);
        stage.setTitle("HOODLY");
        stage.setScene(scene);
        stage.setResizable(false);
        stage.show();
    }

    @Override
    public void stop() {
        AppContext.getInstance().getDatabaseManager().shutdown();
        AppContext.getInstance().getNetworkMonitor().stop();
    }
}
