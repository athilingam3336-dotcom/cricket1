# Cricket Federation REST API & Scoring System Documentation

## Overview
This document specifies the REST APIs, WebSocket events, and database integration for the Cricket Federation Full-Stack Scorer and Tournament Management System.

**Base URL**: `http://localhost:5000/api`

---

## 1. Authentication & Scorer Profile

### 1.1 Scorer Login
- **Endpoint**: `POST /api/scorer/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "scorer@cfvd.org",
  "otp": "1234"
}
```
- **Response** `200 OK`:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "SCR-101",
    "name": "S. Ramesh",
    "email": "scorer@cfvd.org",
    "mobile": "9876543212",
    "role": "SCORER",
    "status": "ACTIVE"
  }
}
```

### 1.2 Scorer Registration
- **Endpoint**: `POST /api/scorer/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "K. Murugan",
  "email": "murugan@cfvd.org",
  "mobile": "9876543213",
  "password": "1234",
  "association": "Virudhunagar District"
}
```
- **Response** `201 Created`:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1Ni...",
  "user": {
    "id": "SCR-102",
    "name": "K. Murugan",
    "email": "murugan@cfvd.org",
    "role": "SCORER",
    "status": "ACTIVE"
  }
}
```

### 1.3 Get Authenticated Profile
- **Endpoint**: `GET /api/scorer/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "id": "SCR-101",
    "name": "S. Ramesh",
    "email": "scorer@cfvd.org",
    "mobile": "9876543212",
    "role": "SCORER",
    "status": "ACTIVE"
  }
}
```

---

## 2. Scorer Dashboard & Assigned Matches

### 2.1 Get Scorer Dashboard Summary
- **Endpoint**: `GET /api/scorer/dashboard`
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "liveMatches": 1,
    "upcomingMatches": 1,
    "completedMatches": 1,
    "assignedMatches": 3,
    "matches": [
      {
        "id": "M002",
        "tournament": "VPL 2026",
        "teamA": "Aruppukottai Avengers",
        "teamB": "Rajapalayam Royals",
        "date": "2026-10-16 02:00 PM",
        "venue": "Srivilliputhur Ground",
        "format": "T20",
        "status": "Live",
        "scoreA": "145/4 (15.2 Ov)",
        "scoreB": "Yet to bat"
      }
    ]
  }
}
```

### 2.2 Get Assigned Matches
- **Endpoint**: `GET /api/scorer/matches?filter=live|upcoming|completed`
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

## 3. Match Setup & Start

### 3.1 Get Match Setup
- **Endpoint**: `GET /api/scorer/matches/:matchId/setup`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "matchId": "M001",
    "tournament": "VPL 2026",
    "venue": "Kamarajar Stadium, Virudhunagar",
    "overs": 20,
    "teamA": { "id": "T001", "name": "Virudhunagar Strikers" },
    "teamB": { "id": "T002", "name": "Sivakasi Super Kings" },
    "teamAPlayers": [ ... ],
    "teamBPlayers": [ ... ]
  }
}
```

### 3.2 Start Match
- **Endpoint**: `POST /api/scorer/matches/:matchId/start`
- **Request Body**:
```json
{
  "tossWinner": "T001",
  "tossDecision": "BAT"
}
```
- **Response** `200 OK`:
```json
{
  "success": true,
  "message": "Match successfully started.",
  "matchId": "M001",
  "inningsId": "INN-M001-1",
  "battingTeamId": "T001",
  "bowlingTeamId": "T002"
}
```

---

## 4. Live Scoring Engine

### 4.1 Get Live Scoring State
- **Endpoint**: `GET /api/scorer/matches/:matchId/live`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "match": { "id": "M002", "overs": 20, "status": "LIVE" },
    "innings": {
      "id": "INN-M002-1",
      "score": "145/4",
      "totalRuns": 145,
      "wickets": 4,
      "overs": "15.2",
      "runRate": 9.46
    },
    "striker": { "id": "P301", "name": "Suresh Kumar", "runs": 45, "balls": 31, "strikeRate": 145.16 },
    "nonStriker": { "id": "P303", "name": "Vijay", "runs": 18, "balls": 12, "strikeRate": 150.00 },
    "bowler": { "id": "P401", "name": "Karthik N", "overs": "3.2", "maidens": 0, "runs": 28, "wickets": 2, "economy": 8.40 },
    "recentDeliveries": [
      { "id": "DEL-01", "ball": "16.1", "runs": 1, "text": "1", "commentary": "Suresh Kumar pushes to mid-off for 1 run." }
    ]
  }
}
```

### 4.2 Record Delivery (Ball-by-Ball)
- **Endpoint**: `POST /api/scorer/matches/:matchId/deliveries`
- **Concurrency Protection**: Protected with `acquireMatchLock` (returns `409 Conflict` if duplicate or concurrent)
- **Request Body**:
```json
{
  "strikerId": "P301",
  "nonStrikerId": "P303",
  "bowlerId": "P401",
  "runsBatter": 4,
  "runsExtras": 0,
  "extraType": "NONE",
  "wicket": false,
  "wicketType": null,
  "dismissedPlayerId": null,
  "replacementBatterId": null
}
```
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "matchId": "M002",
    "score": "149/4",
    "overs": "15.3",
    "strikerId": "P301",
    "nonStrikerId": "P303",
    "lastDelivery": {
      "over": 16,
      "ball": 3,
      "runsBatter": 4,
      "extraType": "NONE",
      "commentary": "FOUR! Beautifully timed by Suresh Kumar! Races away through the gap for a boundary!"
    }
  }
}
```

### 4.3 Undo Last Ball
- **Endpoint**: `POST /api/scorer/matches/:matchId/undo`
- **Response** `200 OK`:
```json
{
  "success": true,
  "message": "Last delivery successfully undone.",
  "data": { "score": "145/4", "overs": "15.2" }
}
```

### 4.4 End Over
- **Endpoint**: `POST /api/scorer/matches/:matchId/end-over`
- **Request Body**: `{ "nextBowlerId": "P402" }`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": { "matchId": "M002", "message": "Over 16 completed." }
}
```

### 4.6 Edit Delivery
- **Endpoint**: `PATCH /api/scorer/matches/:matchId/deliveries/:deliveryId`
- **Request Body**:
```json
{
  "runsBatter": 4,
  "runsExtras": 0,
  "extraType": "NONE",
  "wicket": false
}
```
- **Response** `200 OK`:
```json
{
  "success": true,
  "message": "Delivery edited and innings recalculated successfully.",
  "data": { "score": "148/4", "overs": "15.2", "action": "EDIT_DELIVERY" }
}
```

### 4.7 Conclude / End Match
- **Endpoint**: `POST /api/scorer/matches/:matchId/end`
- **Request Body**:
```json
{
  "resultText": "Match Concluded by Scorer",
  "winnerTeamId": "T001",
  "status": "COMPLETED"
}
```
- **Response** `200 OK`:
```json
{
  "success": true,
  "message": "Match successfully completed.",
  "data": { "matchId": "M002", "status": "COMPLETED", "resultText": "Match Concluded by Scorer" }
}
```

---

## 5. Public Scorecard

### 5.1 Full Scorecard
- **Endpoint**: `GET /api/scorer/matches/:matchId/scorecard`
- **Response** `200 OK`:
```json
{
  "success": true,
  "data": {
    "matchId": "M003",
    "teamA": "Rajapalayam Royals",
    "teamB": "Virudhunagar Strikers",
    "status": "Completed",
    "result": "Virudhunagar Strikers won by 7 wickets",
    "innings": [
      {
        "inningsNumber": 1,
        "battingTeam": "Rajapalayam Royals",
        "score": "160/8 (20.0 Ov)",
        "extras": { "total": 11, "breakdown": "wd 6, nb 1, b 2, lb 2" },
        "batters": [
          { "name": "Praveen K", "runs": 42, "balls": 30, "fours": 4, "sixes": 1, "strikeRate": 140.0, "dismissal": "caught b Eswaran M" }
        ],
        "bowlers": [
          { "name": "Chandran S", "overs": "4.0", "maidens": 1, "runs": 28, "wickets": 2, "economy": 7.0 }
        ]
      }
    ]
  }
}
```

---

## 6. Real-Time Socket.IO Updates

- **Connection**: `ws://localhost:5000`
- **Join Match Room**: `socket.emit('join:match', matchId)`
- **Event Name**: `score:update`
- **Payload**:
```json
{
  "matchId": "M002",
  "score": "149/4",
  "overs": "15.3",
  "totalRuns": 149,
  "wickets": 4,
  "strikerId": "P301",
  "nonStrikerId": "P303",
  "lastDelivery": { ... }
}
```
