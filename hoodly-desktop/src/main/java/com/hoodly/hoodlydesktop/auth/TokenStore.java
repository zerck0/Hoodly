package com.hoodly.hoodlydesktop.auth;

import com.hoodly.hoodlydesktop.db.TokenDao;

public class TokenStore {

    private static TokenStore instance;
    private String accessToken;
    private TokenDao tokenDao;

    private TokenStore() {}

    public static TokenStore getInstance() {
        if (instance == null) {
            instance = new TokenStore();
        }
        return instance;
    }

    public void setTokenDao(TokenDao tokenDao) {
        this.tokenDao = tokenDao;
    }

    public void saveToken(String token) {
        this.accessToken = token;
        if (tokenDao != null) {
            tokenDao.save(token);
        }
    }

    public String getAccessToken() {
        if (accessToken == null && tokenDao != null) {
            accessToken = tokenDao.load();
        }
        return accessToken;
    }

    public boolean hasToken() {
        return getAccessToken() != null && !getAccessToken().isEmpty();
    }

    public void clear() {
        this.accessToken = null;
        if (tokenDao != null) {
            tokenDao.clear();
        }
    }
}
