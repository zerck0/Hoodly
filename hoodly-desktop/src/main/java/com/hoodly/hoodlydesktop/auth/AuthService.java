package com.hoodly.hoodlydesktop.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoodly.hoodlydesktop.ConfigLoader;
import okhttp3.*;

import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URI;

public class AuthService {
    private static final String DOMAIN = ConfigLoader.getInstance().get("auth0.domain");
    private static final String CLIENT_ID = ConfigLoader.getInstance().get("auth0.clientId");
    private static final String AUDIENCE = ConfigLoader.getInstance().get("auth0.audience");
    private static final String REDIRECT_URI = ConfigLoader.getInstance().get("auth0.redirectUri");

    private final PkceFlow pkceFlow = new PkceFlow();
    private final TokenStore tokenStore = TokenStore.getInstance();
    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    private AuthCallback callback;

    public interface AuthCallback {
        void onSuccess(String accessToken);
        void onError(String message);
    }

    public void login(AuthCallback callback) {
        this.callback = callback;

        new Thread(() -> {
            try {
                String codeChallenge = pkceFlow.generateChallenge();

                String authUrl = pkceFlow.buildAuthUrl(
                        DOMAIN, CLIENT_ID, REDIRECT_URI, codeChallenge
                );

                Desktop.getDesktop().browse(new URI(authUrl));

                String code = waitForCallback();

                String token = exchangeCodeForToken(code);

                tokenStore.saveToken(token);
                callback.onSuccess(token);

            } catch (Exception e) {
                callback.onError("Erreur de connexion : " + e.getMessage());
            }
        }).start();
    }

    private String waitForCallback() throws IOException {
        try (ServerSocket serverSocket = new ServerSocket()) {
            serverSocket.bind(new InetSocketAddress("localhost", 3001));
            try (Socket socket = serverSocket.accept()) {
                byte[] buffer = new byte[4096];
                int length = socket.getInputStream().read(buffer);
                String request = new String(buffer, 0, length);

                String response = "HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n" +
                        "<html><body><h2>Connexion reussie !</h2>" +
                        "<p>Vous pouvez fermer cet onglet et retourner sur HOODLY !</p>" +
                        "</body></html>";
                OutputStream out = socket.getOutputStream();
                out.write(response.getBytes());
                out.flush();

                return extractCode(request);
            }
        }
    }

    private String extractCode(String request) {
        String[] lines = request.split(" ");
        String path = lines[1];
        String query = path.split("\\?")[1];
        for (String param : query.split("&")) {
            if (param.startsWith("code=")) {
                return param.substring(5);
            }
        }
        throw new RuntimeException("Code introuvable dans le callback");
    }

    private String exchangeCodeForToken(String code) throws Exception {
        RequestBody body = new FormBody.Builder()
                .add("grant_type", "authorization_code")
                .add("client_id", CLIENT_ID)
                .add("code_verifier", pkceFlow.getCodeVerifier())
                .add("code", code)
                .add("redirect_uri", REDIRECT_URI)
                .build();

        Request request = new Request.Builder()
                .url("https://" + DOMAIN + "/oauth/token")
                .post(body)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            assert response.body() != null;
            String responseBody = response.body().string();
            JsonNode json = mapper.readTree(responseBody);
            return json.get("access_token").asText();
        }
    }
}