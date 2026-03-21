package com.hoodly.hoodlydesktop.auth;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

public class PkceFlow {

    private String codeVerifier;

    public String generateChallenge() throws Exception {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        codeVerifier = Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);

        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(codeVerifier.getBytes());
        return Base64.getUrlEncoder().withoutPadding().encodeToString(hash);
    }

    public String getCodeVerifier() {
        return codeVerifier;
    }

    public String buildAuthUrl(String domain, String clientId
                               , String redirectUri,
                               String codeChallenge) {
        return "https://" + domain + "/authorize" +
                "?response_type=code" +
                "&client_id=" + clientId +
                "&redirect_uri=" + redirectUri +
                "&scope=openid%20profile%20email" +
                "&code_challenge=" + codeChallenge +
                "&code_challenge_method=S256";
    }
}