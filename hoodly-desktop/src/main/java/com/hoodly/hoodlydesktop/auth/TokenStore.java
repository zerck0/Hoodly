package com.hoodly.hoodlydesktop.auth;

public class TokenStore {

    private static TokenStore instance;
    private String accessToken;

    private TokenStore() {}

    public static TokenStore getInstance() {
        if (instance == null) {
            instance = new TokenStore();
        }
        return instance;
    }

    public void saveToken(String token) {
        this.accessToken = token;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public boolean hasToken() {
        return accessToken != null && !accessToken.isEmpty();
    }

    public void clear() {
        this.accessToken = null;
    }
}