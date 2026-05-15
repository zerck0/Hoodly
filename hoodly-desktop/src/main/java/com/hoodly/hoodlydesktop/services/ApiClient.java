package com.hoodly.hoodlydesktop.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoodly.hoodlydesktop.ConfigLoader;
import com.hoodly.hoodlydesktop.auth.TokenStore;
import com.hoodly.hoodlydesktop.db.IncidentDao;
import com.hoodly.hoodlydesktop.models.Incident;
import okhttp3.*;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ApiClient {

    private static final String BASE_URL = ConfigLoader.getInstance().get("api.baseUrl");
    private static final MediaType JSON = MediaType.parse("application/json");

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();
    private final TokenStore tokenStore = TokenStore.getInstance();
    private final IncidentDao incidentDao;

    public ApiClient(IncidentDao incidentDao) {
        this.incidentDao = incidentDao;
    }

    public List<Incident> getIncidents() {
        try {
            Request request = authorizedRequest("/api/incidents").get().build();
            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) throw new Exception("HTTP " + response.code());
                String body = response.body().string();
                List<Incident> fresh = Arrays.asList(mapper.readValue(body, Incident[].class));
                fresh.forEach(incidentDao::upsertFromServer);
            }
        } catch (Exception ignored) {}
        return incidentDao.findAll();
    }

    public Incident createIncident(Incident incident) throws Exception {
        String json = mapper.writeValueAsString(incident);
        RequestBody body = RequestBody.create(json, JSON);
        Request request = authorizedRequest("/api/incidents").post(body).build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new Exception("HTTP " + response.code());
            return mapper.readValue(response.body().string(), Incident.class);
        }
    }

    public void patchIncidentStatut(String id, String statut) throws Exception {
        String json = mapper.writeValueAsString(Collections.singletonMap("statut", statut));
        RequestBody body = RequestBody.create(json, JSON);
        Request request = authorizedRequest("/api/incidents/" + id).patch(body).build();
        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) throw new Exception("HTTP " + response.code());
        }
    }

    private Request.Builder authorizedRequest(String url) {
        return new Request.Builder()
                .url(BASE_URL + url)
                .header("Authorization", "Bearer " + tokenStore.getAccessToken());
    }
}
