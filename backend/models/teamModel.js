/**
 * models/teamModel.js
 * MySQL Model for Team Registration, Authentication, and Squad Management.
 */

const db = require('../config/db');

class TeamModel {
  /**
   * Generates next available unique Team ID dynamically in format: TEAM-VRD-1001
   */
  async generateNextTeamId() {
    const [rows] = await db.query("SELECT team_id FROM teams WHERE team_id LIKE 'TEAM-VRD-%'");
    let maxNum = 1000;

    if (rows && rows.length > 0) {
      rows.forEach(r => {
        if (r.team_id) {
          const match = r.team_id.match(/TEAM-VRD-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });
    }

    const nextId = `TEAM-VRD-${maxNum + 1}`;
    return nextId;
  }

  /**
   * Find team by coach email
   */
  async findByCoachEmail(email) {
    if (!email) return null;
    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await db.query('SELECT * FROM teams WHERE LOWER(coach_email) = ?', [cleanEmail]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find team by Team ID or Coach Email
   */
  async findByIdentifier(identifier) {
    if (!identifier) return null;
    const cleanId = identifier.trim().toLowerCase();
    const [rows] = await db.query(
      'SELECT * FROM teams WHERE LOWER(team_id) = ? OR LOWER(coach_email) = ?',
      [cleanId, cleanId]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Find team by internal ID
   */
  async findById(id) {
    if (!id) return null;
    const [rows] = await db.query('SELECT * FROM teams WHERE id = ?', [id]);
    return rows && rows.length > 0 ? rows[0] : null;
  }

  /**
   * Atomically create team and insert exactly 15 players inside a database transaction.
   */
  async createTeamWithTransaction({ id, teamId, teamName, coachName, coachEmail, passkeyHash, players }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Insert team
      await conn.query(
        `INSERT INTO teams (id, team_id, team_name, coach_name, coach_email, team_passkey_hash, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'APPROVED', NOW(), NOW())`,
        [id, teamId, teamName, coachName, coachEmail, passkeyHash]
      );

      // 2. Insert all 15 squad players
      for (const p of players) {
        const playerId = 'TP-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        await conn.query(
          `INSERT INTO team_players (id, team_id, player_name, player_email, player_role, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [playerId, id, p.name.trim(), p.email.trim().toLowerCase(), p.role.trim()]
        );
      }

      await conn.commit();
      conn.release();
      return true;
    } catch (err) {
      await conn.rollback();
      conn.release();
      throw err;
    }
  }

  /**
   * Get 15 players belonging to a team
   */
  async getPlayersByTeamId(teamInternalId) {
    if (!teamInternalId) return [];
    const [rows] = await db.query(
      'SELECT id, player_name, player_email, player_role, created_at FROM team_players WHERE team_id = ? ORDER BY id ASC',
      [teamInternalId]
    );
    return rows || [];
  }

  /**
   * Get all registered teams (for Admin)
   */
  async getAllTeams() {
    const [teams] = await db.query('SELECT * FROM teams ORDER BY created_at DESC');
    if (!teams || teams.length === 0) return [];

    const result = [];
    for (const t of teams) {
      const [players] = await db.query('SELECT COUNT(*) as player_count FROM team_players WHERE team_id = ?', [t.id]);
      const count = (players && players[0] && (players[0].player_count !== undefined ? players[0].player_count : players.length)) || 0;
      result.push({
        id: t.id,
        team_id: t.team_id,
        team_name: t.team_name,
        coach_name: t.coach_name,
        coach_email: t.coach_email,
        status: t.status,
        player_count: count,
        created_at: t.created_at
      });
    }
    return result;
  }
}

module.exports = new TeamModel();
