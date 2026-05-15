package com.hoodly.hoodlydesktop.db;

import com.hoodly.hoodlydesktop.models.Incident;

import java.sql.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class IncidentDao {

    private final Connection connection;

    public IncidentDao(DatabaseManager db) {
        this.connection = db.getConnection();
    }

    // Insère ou met à jour un incident venant du serveur,
    // sans écraser les lignes avec des changements locaux en attente.
    public void upsertFromServer(Incident incident) {
        String checkSql = "SELECT sync_status FROM incidents WHERE id = ?";
        try (PreparedStatement check = connection.prepareStatement(checkSql)) {
            check.setString(1, incident.getId());
            ResultSet rs = check.executeQuery();
            if (rs.next() && !rs.getString("sync_status").equals("synced")) {
                return; // changement local en attente, on ne touche pas
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur upsertFromServer : " + e.getMessage(), e);
        }

        String sql = """
            INSERT OR REPLACE INTO incidents
                (id, type, description, statut, priorite, signaled_par, zone_id, photo_url,
                 created_at, updated_at, synced_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')
        """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, incident.getId());
            stmt.setString(2, incident.getType());
            stmt.setString(3, incident.getDescription());
            stmt.setString(4, incident.getStatut());
            stmt.setString(5, incident.getPriorite());
            stmt.setString(6, incident.getSignaledPar());
            stmt.setString(7, incident.getZoneId());
            stmt.setString(8, incident.getPhotoUrl());
            stmt.setString(9, incident.getCreatedAt());
            stmt.setString(10, incident.getUpdatedAt());
            stmt.setString(11, Instant.now().toString());
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur upsertFromServer : " + e.getMessage(), e);
        }
    }

    public List<Incident> findAll() {
        List<Incident> incidents = new ArrayList<>();
        String sql = "SELECT * FROM incidents ORDER BY created_at DESC";
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                incidents.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur findAll : " + e.getMessage(), e);
        }
        return incidents;
    }

    public List<Incident> findPending() {
        List<Incident> incidents = new ArrayList<>();
        String sql = "SELECT * FROM incidents WHERE sync_status IN ('pending_create', 'pending_update')";
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            while (rs.next()) {
                incidents.add(mapRow(rs));
            }
        } catch (SQLException e) {
            throw new RuntimeException("Erreur findPending : " + e.getMessage(), e);
        }
        return incidents;
    }

    public void insertOffline(Incident incident) {
        incident.setId(UUID.randomUUID().toString());
        String sql = """
            INSERT INTO incidents
                (id, type, description, statut, priorite, signaled_par, zone_id, photo_url,
                 created_at, sync_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_create')
        """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, incident.getId());
            stmt.setString(2, incident.getType());
            stmt.setString(3, incident.getDescription());
            stmt.setString(4, incident.getStatut() != null ? incident.getStatut() : "signale");
            stmt.setString(5, incident.getPriorite() != null ? incident.getPriorite() : "normale");
            stmt.setString(6, incident.getSignaledPar());
            stmt.setString(7, incident.getZoneId());
            stmt.setString(8, incident.getPhotoUrl());
            stmt.setString(9, Instant.now().toString());
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur insertOffline : " + e.getMessage(), e);
        }
    }

    public void updateStatutOffline(String id, String newStatut) {
        String sql = """
            UPDATE incidents
            SET statut = ?,
                sync_status = CASE WHEN sync_status = 'synced' THEN 'pending_update' ELSE sync_status END
            WHERE id = ?
        """;
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, newStatut);
            stmt.setString(2, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur updateStatutOffline : " + e.getMessage(), e);
        }
    }

    // Après qu'un pending_create a été accepté par le serveur
    public void markSyncedWithNewId(String localId, String serverId) {
        String sql = "UPDATE incidents SET id = ?, sync_status = 'synced', synced_at = ? WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, serverId);
            stmt.setString(2, Instant.now().toString());
            stmt.setString(3, localId);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur markSyncedWithNewId : " + e.getMessage(), e);
        }
    }

    // Après qu'un pending_update a été accepté par le serveur
    public void markSynced(String id) {
        String sql = "UPDATE incidents SET sync_status = 'synced', synced_at = ? WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, Instant.now().toString());
            stmt.setString(2, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur markSynced : " + e.getMessage(), e);
        }
    }

    public void deleteById(String id) {
        String sql = "DELETE FROM incidents WHERE id = ?";
        try (PreparedStatement stmt = connection.prepareStatement(sql)) {
            stmt.setString(1, id);
            stmt.executeUpdate();
        } catch (SQLException e) {
            throw new RuntimeException("Erreur deleteById : " + e.getMessage(), e);
        }
    }

    public int countPending() {
        String sql = "SELECT COUNT(*) FROM incidents WHERE sync_status != 'synced'";
        try (PreparedStatement stmt = connection.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {
            return rs.next() ? rs.getInt(1) : 0;
        } catch (SQLException e) {
            throw new RuntimeException("Erreur countPending : " + e.getMessage(), e);
        }
    }

    private Incident mapRow(ResultSet rs) throws SQLException {
        Incident i = new Incident();
        i.setId(rs.getString("id"));
        i.setType(rs.getString("type"));
        i.setDescription(rs.getString("description"));
        i.setStatut(rs.getString("statut"));
        i.setPriorite(rs.getString("priorite"));
        i.setSignaledPar(rs.getString("signaled_par"));
        i.setZoneId(rs.getString("zone_id"));
        i.setPhotoUrl(rs.getString("photo_url"));
        i.setCreatedAt(rs.getString("created_at"));
        i.setUpdatedAt(rs.getString("updated_at"));
        i.setSyncStatus(rs.getString("sync_status"));
        return i;
    }
}
