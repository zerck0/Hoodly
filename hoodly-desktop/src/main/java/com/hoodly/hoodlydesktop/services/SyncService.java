package com.hoodly.hoodlydesktop.services;

import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.models.Incident;
import javafx.application.Platform;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class SyncService {

    private final ApiClient apiClient;
    private final IncidentDao incidentDao;
    private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
        Thread t = new Thread(r, "sync-service");
        t.setDaemon(true);
        return t;
    });

    private final List<Runnable> onSyncCompleteListeners = new CopyOnWriteArrayList<>();

    public SyncService(ApiClient apiClient, IncidentDao incidentDao) {
        this.apiClient = apiClient;
        this.incidentDao = incidentDao;
    }

    public void addOnSyncCompleteListener(Runnable listener) {
        onSyncCompleteListeners.add(listener);
    }

    public void syncNow() {
        executor.submit(() -> {
            List<Incident> pending = incidentDao.findPending();
            for (Incident incident : pending) {
                try {
                    if ("pending_create".equals(incident.getSyncStatus())) {
                        Incident created = apiClient.createIncident(incident);
                        incidentDao.markSyncedWithNewId(incident.getId(), created.getId());
                    } else if ("pending_update".equals(incident.getSyncStatus())) {
                        apiClient.patchIncidentStatut(incident.getId(), incident.getStatut());
                        incidentDao.markSynced(incident.getId());
                    }
                } catch (Exception e) {
                    System.err.println("Échec de sync pour l'incident " + incident.getId() + " : " + e.getMessage());
                }
            }
            Platform.runLater(() -> onSyncCompleteListeners.forEach(Runnable::run));
        });
    }
}
