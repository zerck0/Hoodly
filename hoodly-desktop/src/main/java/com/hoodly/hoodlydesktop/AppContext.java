package com.hoodly.hoodlydesktop;

import com.hoodly.hoodlydesktop.db.DatabaseManager;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.db.TokenDao;
import com.hoodly.hoodlydesktop.services.ApiClient;
import com.hoodly.hoodlydesktop.services.NetworkMonitor;
import com.hoodly.hoodlydesktop.services.SyncService;

public class AppContext {

    private static AppContext instance;

    private DatabaseManager databaseManager;
    private IncidentDao incidentDao;
    private TokenDao tokenDao;
    private ApiClient apiClient;
    private NetworkMonitor networkMonitor;
    private SyncService syncService;

    private AppContext() {}

    public static AppContext getInstance() {
        if (instance == null) {
            instance = new AppContext();
        }
        return instance;
    }

    public DatabaseManager getDatabaseManager() { return databaseManager; }
    public void setDatabaseManager(DatabaseManager databaseManager) { this.databaseManager = databaseManager; }

    public IncidentDao getIncidentDao() { return incidentDao; }
    public void setIncidentDao(IncidentDao incidentDao) { this.incidentDao = incidentDao; }

    public TokenDao getTokenDao() { return tokenDao; }
    public void setTokenDao(TokenDao tokenDao) { this.tokenDao = tokenDao; }

    public ApiClient getApiClient() { return apiClient; }
    public void setApiClient(ApiClient apiClient) { this.apiClient = apiClient; }

    public NetworkMonitor getNetworkMonitor() { return networkMonitor; }
    public void setNetworkMonitor(NetworkMonitor networkMonitor) { this.networkMonitor = networkMonitor; }

    public SyncService getSyncService() { return syncService; }
    public void setSyncService(SyncService syncService) { this.syncService = syncService; }
}
