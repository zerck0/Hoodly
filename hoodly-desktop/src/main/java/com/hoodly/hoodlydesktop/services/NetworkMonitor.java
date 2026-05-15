package com.hoodly.hoodlydesktop.services;

import com.hoodly.hoodlydesktop.ConfigLoader;
import javafx.application.Platform;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;

public class NetworkMonitor {

    private static final String BASE_URL = ConfigLoader.getInstance().get("api.baseUrl");
    private static final int POLL_INTERVAL_SECONDS = 15;
    private static final int TIMEOUT_SECONDS = 3;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "network-monitor");
        t.setDaemon(true);
        return t;
    });

    private final AtomicBoolean online = new AtomicBoolean(false);
    private final List<Consumer<Boolean>> listeners = new CopyOnWriteArrayList<>();

    public void start() {
        scheduler.scheduleAtFixedRate(this::probe, 0, POLL_INTERVAL_SECONDS, TimeUnit.SECONDS);
    }

    public void stop() {
        scheduler.shutdownNow();
    }

    public boolean isOnline() {
        return online.get();
    }

    public void addListener(Consumer<Boolean> listener) {
        listeners.add(listener);
    }

    private void probe() {
        boolean reachable = false;
        try {
            Request request = new Request.Builder()
                    .url(BASE_URL + "/api/incidents")
                    .head()
                    .build();
            try (Response response = httpClient.newCall(request).execute()) {
                reachable = true;
            }
        } catch (Exception ignored) {}

        boolean previous = online.getAndSet(reachable);
        if (previous != reachable) {
            boolean finalReachable = reachable;
            Platform.runLater(() -> listeners.forEach(l -> l.accept(finalReachable)));
        }
    }
}
