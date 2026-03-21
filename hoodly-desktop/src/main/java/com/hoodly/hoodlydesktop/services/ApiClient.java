package com.hoodly.hoodlydesktop.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoodly.hoodlydesktop.ConfigLoader;
import com.hoodly.hoodlydesktop.auth.TokenStore;
import com.hoodly.hoodlydesktop.models.Incident;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

import java.util.Arrays;
import java.util.List;

public class ApiClient {

    private static final String BASE_URL = ConfigLoader.getInstance().get("api.baseUrl");

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();
    private final TokenStore tokenStore = TokenStore.getInstance();

    private Request.Builder authorizedRequest(String url) {
        return new Request.Builder()
                .url(BASE_URL + url)
                .header("Authorization", "Bearer " + tokenStore.getAccessToken());
    }

    public List<Incident> getIncidents() throws Exception {
        Request request = authorizedRequest("/api/incidents").get().build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                throw new Exception("Erreur API : " + response.code());
            }
            String body = response.body().string();
            Incident[] incidents = mapper.readValue(body, Incident[].class);
            return Arrays.asList(incidents);
        }
    }
}