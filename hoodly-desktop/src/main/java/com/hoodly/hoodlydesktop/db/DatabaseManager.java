package com.hoodly.hoodlydesktop.db;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {

    private static DatabaseManager instance;
    private Connection connection;

    private DatabaseManager() {
        try {
            Path dbDir = Paths.get(System.getProperty("user.home"), ".hoodly");
            Files.createDirectories(dbDir);
            String dbPath = dbDir.resolve("hoodly.db").toString();

            connection = DriverManager.getConnection("jdbc:sqlite:" + dbPath);

            try (Statement stmt = connection.createStatement()) {
                stmt.execute("PRAGMA journal_mode=WAL");
                stmt.execute("PRAGMA foreign_keys=ON");
                createTables(stmt);
            }
        } catch (SQLException | IOException e) {
            throw new RuntimeException("Erreur d'initialisation de la base de données : " + e.getMessage(), e);
        }
    }

    private void createTables(Statement stmt) throws SQLException {
        stmt.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id            TEXT PRIMARY KEY,
                type          TEXT NOT NULL,
                description   TEXT NOT NULL,
                statut        TEXT NOT NULL DEFAULT 'signale',
                priorite      TEXT NOT NULL DEFAULT 'normale',
                signaled_par  TEXT,
                zone_id       TEXT,
                photo_url     TEXT,
                created_at    TEXT,
                updated_at    TEXT,
                synced_at     TEXT,
                sync_status   TEXT NOT NULL DEFAULT 'synced'
                    CHECK(sync_status IN ('synced', 'pending_create', 'pending_update'))
            )
        """);

        stmt.execute("""
            CREATE TABLE IF NOT EXISTS auth_tokens (
                id            INTEGER PRIMARY KEY CHECK(id = 1),
                access_token  TEXT NOT NULL,
                saved_at      TEXT NOT NULL
            )
        """);
    }

    public static DatabaseManager getInstance() {
        if (instance == null) {
            instance = new DatabaseManager();
        }
        return instance;
    }

    public Connection getConnection() {
        return connection;
    }

    public void shutdown() {
        try {
            if (connection != null && !connection.isClosed()) {
                connection.close();
            }
        } catch (SQLException e) {
            System.err.println("Erreur lors de la fermeture de la base : " + e.getMessage());
        }
    }
}
