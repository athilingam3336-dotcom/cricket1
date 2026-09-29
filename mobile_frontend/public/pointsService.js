// pointsService.js
// Module 10: Result and Points Table

const PointsService = {
  // Config for points calculation
  POINTS: {
    WIN: 2,
    TIE: 1,
    NO_RESULT: 1,
    LOSS: 0
  },

  // Calculate points table dynamically
  calculatePointsTable: () => {
    // We will compute this based on matches in ScoringService
    const allSetups = typeof ScoringService !== 'undefined' ? ScoringService.getAllSetups() : {};
    const teams = {};

    // Helper to init team
    const initTeam = (name, crest) => {
      if (!teams[name]) {
        teams[name] = { 
          name, 
          crest: crest || name.substring(0, 2).toUpperCase(),
          matches: 0, won: 0, lost: 0, tied: 0, noResult: 0, 
          points: 0, runRate: 0, recentForm: [] 
        };
      }
    };

    // For demonstration, let's pre-populate the 7 teams that were historically on the screen
    initTeam("Virudhunagar Strikers CC", "VS");
    initTeam("Sivakasi Super Kings", "SSK");
    initTeam("Rajapalayam Cricket Club", "RCC");
    initTeam("Srivilliputhur Warriors", "SW");
    initTeam("Aruppukottai Stars CC", "AKS");
    initTeam("Sattur Cricket XI", "SXI");
    initTeam("Thiruthangal CC", "TKC");

    // Process all setups that have a result
    Object.values(allSetups).forEach(match => {
      if (!match.resultStatus) return; // Not finished

      initTeam(match.team1Name || "Team 1");
      initTeam(match.team2Name || "Team 2");

      const t1 = teams[match.team1Name || "Team 1"];
      const t2 = teams[match.team2Name || "Team 2"];

      t1.matches++;
      t2.matches++;

      if (match.resultStatus === 'Completed') {
        if (match.winner === t1.name) {
          t1.won++; t1.points += PointsService.POINTS.WIN; t1.recentForm.push('W');
          t2.lost++; t2.recentForm.push('L');
        } else {
          t2.won++; t2.points += PointsService.POINTS.WIN; t2.recentForm.push('W');
          t1.lost++; t1.recentForm.push('L');
        }
      } else if (match.resultStatus === 'Tied') {
        t1.tied++; t1.points += PointsService.POINTS.TIE; t1.recentForm.push('T');
        t2.tied++; t2.points += PointsService.POINTS.TIE; t2.recentForm.push('T');
      } else if (match.resultStatus === 'No Result') {
        t1.noResult++; t1.points += PointsService.POINTS.NO_RESULT; t1.recentForm.push('NR');
        t2.noResult++; t2.points += PointsService.POINTS.NO_RESULT; t2.recentForm.push('NR');
      }
    });

    // Sort by points, then by matches won, then by NRR (mocked as 0 for now)
    return Object.values(teams).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.won !== a.won) return b.won - a.won;
      return b.runRate - a.runRate;
    });
  }
};

function renderPointsTable() {
  const tbody = document.getElementById('pointsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  const tableData = PointsService.calculatePointsTable();

  tableData.forEach((team, index) => {
    let rankBadge = '';
    if (index === 0) rankBadge = '<span class="badge-rank gold">1</span>';
    else if (index === 1) rankBadge = '<span class="badge-rank silver">2</span>';
    else if (index === 2) rankBadge = '<span class="badge-rank bronze">3</span>';
    else rankBadge = index + 1;

    let formHtml = '';
    team.recentForm.slice(-5).forEach(f => {
      const cls = f === 'W' ? 'w' : (f === 'L' ? 'l' : 'd');
      formHtml += `<span class="form-pill ${cls}">${f}</span>\n`;
    });

    tbody.innerHTML += `
      <tr class="${index < 4 ? 'qualified-row' : ''}">
        <td class="text-center rank-num">${rankBadge}</td>
        <td>
          <div class="team-cell">
            <div class="team-mini-crest">${team.crest}</div>
            <div>
              <strong>${team.name}</strong>
              ${index < 4 ? '<span class="table-sub">Qualified for Semis</span>' : ''}
            </div>
          </div>
        </td>
        <td class="text-center">${team.matches}</td>
        <td class="text-center text-bold">${team.won}</td>
        <td class="text-center">${team.lost}</td>
        <td class="text-center">${team.tied}</td>
        <td class="text-center">${team.noResult}</td>
        <td class="text-center pts-col">${team.points}</td>
        <td class="text-center">${team.runRate > 0 ? '+' : ''}${team.runRate.toFixed(3)}</td>
        <td class="text-center">${formHtml}</td>
      </tr>
    `;
  });
}

// Intercept window load to render the table initially
window.addEventListener('DOMContentLoaded', () => {
  // Give a small delay to ensure all services are loaded
  setTimeout(renderPointsTable, 500);
});

// UI Handlers for Match Result Tab
function handleResultStatusChange() {
  const status = document.getElementById('result_status').value;
  const winnerGroup = document.getElementById('result_winner_group');
  if (status === 'Completed') {
    winnerGroup.style.display = 'block';
  } else {
    winnerGroup.style.display = 'none';
  }
}

// Override or inject into initMatchSetup to prepare result tab
const origInitMatchSetupForResults = window.initMatchSetup;
window.initMatchSetup = function(matchId) {
  if (origInitMatchSetupForResults) origInitMatchSetupForResults(matchId);
  
  // Extract teams again for this tab
  const title = document.getElementById('modalMatchTitle').innerText;
  let t1 = "Team 1", t2 = "Team 2";
  if (title.includes('vs')) {
    const parts = title.split('vs');
    t1 = parts[0].trim();
    t2 = parts[1].trim();
  }

  // Populate Winner Dropdown
  const winnerSel = document.getElementById('result_winner');
  winnerSel.innerHTML = `
    <option value="">-- Select Winner --</option>
    <option value="${t1}">${t1}</option>
    <option value="${t2}">${t2}</option>
  `;

  // Pre-fill if already saved
  const existing = ScoringService.getMatchSetup(matchId);
  if (existing && existing.resultStatus) {
    document.getElementById('result_status').value = existing.resultStatus;
    handleResultStatusChange();
    if (existing.winner) document.getElementById('result_winner').value = existing.winner;
    if (existing.resultSummary) document.getElementById('result_summary_text').value = existing.resultSummary;
  } else {
    document.getElementById('result_status').value = '';
    handleResultStatusChange();
    document.getElementById('result_summary_text').value = '';
  }
};

function saveMatchResult() {
  const errorMsg = document.getElementById('result_error_msg');
  errorMsg.innerText = '';

  const status = document.getElementById('result_status').value;
  const winner = document.getElementById('result_winner').value;
  const summary = document.getElementById('result_summary_text').value;

  if (!status) return errorMsg.innerText = "Please select a match status.";
  if (status === 'Completed' && !winner) return errorMsg.innerText = "Please select a winning team.";
  
  // Get matchId (assuming currentScoringMatchId from scoringService is accessible globally)
  if (typeof currentScoringMatchId === 'undefined' || !currentScoringMatchId) {
    return errorMsg.innerText = "Error: Match ID not found.";
  }

  // Save via ScoringService
  let dataToSave = { resultStatus: status, resultSummary: summary };
  if (status === 'Completed') {
    dataToSave.winner = winner;
  } else {
    dataToSave.winner = null; // Clear if changed to Tied/No Result
  }
  
  // Also pass team names down so PointsService knows who played
  const title = document.getElementById('modalMatchTitle').innerText;
  if (title.includes('vs')) {
    const parts = title.split('vs');
    dataToSave.team1Name = parts[0].trim();
    dataToSave.team2Name = parts[1].trim();
  }

  ScoringService.saveMatchSetup(currentScoringMatchId, dataToSave);
  
  // Re-render Points Table globally
  renderPointsTable();

  alert('Result saved and Points Table updated!');
}
