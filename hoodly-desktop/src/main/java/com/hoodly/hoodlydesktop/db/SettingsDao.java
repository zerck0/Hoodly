package com.hoodly.hoodlydesktop.db;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class SettingsDao {

    private final Connection connection;

    public SettingsDao(DatabaseManager db) {
        this.connection = db.getConnection();
    }

    public String get(String key, String defaultValue) {
        String sql = "SELECT value FROM settings WHERE key = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, key);
            ResultSet rs = stmt.executeQuery();
            return rs.next() ? rs.getString("value") : defaultValue;
        } catch (SQLException e) {
            return defaultValue;
        }
    }

    public void set(String key, String value) {
        String sql = "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, key);
            stmt.setString(2, value);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur settings : " + e.getMessage(), e);
        }
    }
}
