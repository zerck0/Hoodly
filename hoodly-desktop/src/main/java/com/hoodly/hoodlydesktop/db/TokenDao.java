package com.hoodly.hoodlydesktop.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;

public class TokenDao {

    private final Connection connection;

    public TokenDao(DatabaseManager db) {
        this.connection = db.getConnection();
    }

    public void save(String accessToken) {
        String sql = "INSERT OR REPLACE INTO auth_tokens(id, access_token, saved_at) VALUES(1, ?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, accessToken);
            stmt.setString(2, Instant.now().toString());
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la sauvegarde du token : " + e.getMessage(), e);
        }
    }

    public String load() {
        String sql = "SELECT access_token FROM auth_tokens WHERE id = 1";
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            if (rs.next()) {
                return rs.getString("access_token");
            }
            return null;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors du chargement du token : " + e.getMessage(), e);
        }
    }

    public void clear() {
        String sql = "DELETE FROM auth_tokens WHERE id = 1";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur lors de la suppression du token : " + e.getMessage(), e);
        }
    }
}
