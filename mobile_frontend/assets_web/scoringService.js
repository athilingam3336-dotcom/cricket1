// scoringService.js
// Module 9: Match Day Live Scoring (Pre-match Setup)

const SCORING_SETUP_KEY = 'cricket_scoring_setup';

if (!localStorage.getItem(SCORING_SETUP_KEY)) {
  localStorage.setItem(SCORING_SETUP_KEY, JSON.stringify({}));
}

const ScoringService = {
  getAllSetups: () => JSON.parse(localStorage.getItem(SCORING_SETUP_KEY) || '{}'),
  saveAllSetups: (data) => localStorage.setItem(SCORING_SETUP_KEY, JSON.stringify(data)),
  
  getMatchSetup: (matchId) => ScoringService.getAllSetups()[matchId],
  
  saveMatchSetup: (matchId, data) => {
    const all = ScoringService.getAllSetups();
    if (!all[matchId]) all[matchId] = {};
    
    // Audit overs change
    if (all[matchId].overs && all[matchId].overs !== data.overs) {
      if (!data.auditNotes) data.auditNotes = [];
      data.auditNotes.push(`Overs changed from ${all[matchId].overs} to ${data.overs} at ${new Date().toLocaleTimeString()} by Admin. Note: ${data.auditReason || 'No reason provided'}`);
    }
    
    all[matchId] = { ...all[matchId], ...data, isStarted: true };
    ScoringService.saveAllSetups(all);
  }
};

// UI Variables
let currentScoringMatchId = null;
let team1Name = "Team 1";
let team2Name = "Team 2";
let team1Squad = [];
let team2Squad = [];

// Override original modal open to inject setup logic
const originalOpenScorecardModalForScoring = window.openScorecardModal;
window.openScorecardModal = function(matchId) {
  if (originalOpenScorecardModalForScoring) originalOpenScorecardModalForScoring(matchId);
  initMatchSetup(matchId);
};

function initMatchSetup(matchId) {
  currentScoringMatchId = matchId;
  
  // Extract team names from modal title (e.g., "Virudhunagar Strikers vs Sivakasi Super Kings")
  const title = document.getElementById('modalMatchTitle').innerText;
  if (title.includes('vs')) {
    const parts = title.split('vs');
    team1Name = parts[0].trim();
    team2Name = parts[1].trim();
  }
  
  document.getElementById('lbl_team1_name').innerText = team1Name;
  document.getElementById('lbl_team2_name').innerText = team2Name;
  
  // Populate Toss Winner
  const tossWinner = document.getElementById('setup_toss_winner');
  tossWinner.innerHTML = `
    <option value="">-- Select Winner --</option>
    <option value="${team1Name}">${team1Name}</option>
    <option value="${team2Name}">${team2Name}</option>
  `;
  
  // Fetch/Mock squads
  team1Squad = getOrMockSquad(team1Name, 'T1');
  team2Squad = getOrMockSquad(team2Name, 'T2');
  
  renderSquadSelection('setup_team1_squad', team1Squad, 'T1');
  renderSquadSelection('setup_team2_squad', team2Squad, 'T2');
  
  updateCaptWkDropdowns();
  
  // Check if match already started
  const existingSetup = ScoringService.getMatchSetup(matchId);
  if (existingSetup && existingSetup.isStarted) {
    document.getElementById('setup_toss_winner').value = existingSetup.tossWinner || '';
    document.getElementById('setup_toss_decision').value = existingSetup.tossDecision || 'Bat';
    document.getElementById('setup_overs').value = existingSetup.overs || 20;
    
    // Hide Start Match button since it's already started
    document.getElementById('btn_start_match').innerText = 'Update Match Setup';
    
    // Switch to scorecard tab by default if already started
    switchModalTab('summary');
  } else {
    // Force user to setup tab
    switchModalTab('setup');
    document.getElementById('btn_start_match').innerText = 'Start Match & Enable Scoring';
  }
}

function getOrMockSquad(teamName, prefix) {
  // Ideally pulls from PlayerService where selectedTeam = teamName and status = Confirmed
  // But for the demo to work with hardcoded match cards, we mock 15 players if none exist.
  let players = typeof PlayerService !== 'undefined' ? PlayerService.getAll().filter(p => p.selectedTeamId === teamName && p.status === 'Confirmed') : [];
  
  if (players.length < 11) {
    players = Array.from({ length: 15 }).map((_, i) => ({
      id: `${prefix}_P${i+1}`,
      fullName: `${teamName} Player ${i+1}`,
      speciality: i < 5 ? 'Batter' : (i < 9 ? 'All-rounder' : 'Bowler')
    }));
  }
  return players;
}

function renderSquadSelection(containerId, squad, prefix) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  
  const existingSetup = ScoringService.getMatchSetup(currentScoringMatchId);
  const selectedIds = existingSetup ? (prefix === 'T1' ? existingSetup.team1XI : existingSetup.team2XI) || [] : [];
  
  squad.forEach(player => {
    const isChecked = selectedIds.includes(player.id) ? 'checked' : '';
    container.innerHTML += `
      <label style="display:flex; align-items:center; gap:8px; padding:4px 0; font-size:13px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05);">
        <input type="checkbox" class="cb-squad-${prefix}" value="${player.id}" data-name="${player.fullName}" onchange="handleSquadSelection('${prefix}')" ${isChecked}>
        <span>${player.fullName} <small style="color:#888;">(${player.speciality})</small></span>
      </label>
    `;
  });
  handleSquadSelection(prefix); // update counts initially
}

function handleSquadSelection(prefix) {
  const checkboxes = document.querySelectorAll(`.cb-squad-${prefix}:checked`);
  const countSpan = document.getElementById(prefix === 'T1' ? 'count_team1' : 'count_team2');
  countSpan.innerText = checkboxes.length;
  
  if (checkboxes.length > 11) {
    countSpan.style.color = '#ff6b6b';
  } else if (checkboxes.length === 11) {
    countSpan.style.color = '#81c784';
  } else {
    countSpan.style.color = '#aaa';
  }
  
  updateCaptWkDropdowns();
}

function updateCaptWkDropdowns() {
  const t1Selected = Array.from(document.querySelectorAll('.cb-squad-T1:checked')).map(cb => ({ id: cb.value, name: cb.dataset.name }));
  const t2Selected = Array.from(document.querySelectorAll('.cb-squad-T2:checked')).map(cb => ({ id: cb.value, name: cb.dataset.name }));
  
  populateSelect('setup_team1_capt', t1Selected);
  populateSelect('setup_team1_wk', t1Selected);
  populateSelect('setup_team2_capt', t2Selected);
  populateSelect('setup_team2_wk', t2Selected);
  
  const existingSetup = ScoringService.getMatchSetup(currentScoringMatchId);
  if (existingSetup) {
    if (existingSetup.team1Capt) document.getElementById('setup_team1_capt').value = existingSetup.team1Capt;
    if (existingSetup.team1Wk) document.getElementById('setup_team1_wk').value = existingSetup.team1Wk;
    if (existingSetup.team2Capt) document.getElementById('setup_team2_capt').value = existingSetup.team2Capt;
    if (existingSetup.team2Wk) document.getElementById('setup_team2_wk').value = existingSetup.team2Wk;
  }
}

function populateSelect(selectId, items) {
  const sel = document.getElementById(selectId);
  const currentVal = sel.value;
  sel.innerHTML = '<option value="">-- Select --</option>';
  items.forEach(item => {
    sel.innerHTML += `<option value="${item.id}">${item.name}</option>`;
  });
  if (items.some(i => i.id === currentVal)) {
    sel.value = currentVal;
  }
}

function startMatchScoring() {
  const errorMsg = document.getElementById('setup_error_msg');
  errorMsg.innerText = '';
  
  const tossWinner = document.getElementById('setup_toss_winner').value;
  const tossDecision = document.getElementById('setup_toss_decision').value;
  const overs = document.getElementById('setup_overs').value;
  const auditReason = document.getElementById('setup_overs_audit').value;
  
  const t1XI = Array.from(document.querySelectorAll('.cb-squad-T1:checked')).map(cb => cb.value);
  const t2XI = Array.from(document.querySelectorAll('.cb-squad-T2:checked')).map(cb => cb.value);
  
  const t1Capt = document.getElementById('setup_team1_capt').value;
  const t1Wk = document.getElementById('setup_team1_wk').value;
  const t2Capt = document.getElementById('setup_team2_capt').value;
  const t2Wk = document.getElementById('setup_team2_wk').value;
  
  if (!tossWinner || !tossDecision) return errorMsg.innerText = "Please complete the Toss information.";
  if (t1XI.length !== 11) return errorMsg.innerText = `Team 1 must have exactly 11 players selected. Currently selected: ${t1XI.length}`;
  if (t2XI.length !== 11) return errorMsg.innerText = `Team 2 must have exactly 11 players selected. Currently selected: ${t2XI.length}`;
  if (!t1Capt || !t1Wk) return errorMsg.innerText = "Please select Team 1 Captain and Wicket Keeper.";
  if (!t2Capt || !t2Wk) return errorMsg.innerText = "Please select Team 2 Captain and Wicket Keeper.";
  if (!overs || overs < 1) return errorMsg.innerText = "Please set a valid number of overs.";
  
  const setupData = {
    tossWinner,
    tossDecision,
    overs: parseInt(overs),
    auditReason,
    team1XI: t1XI,
    team2XI: t2XI,
    team1Capt: t1Capt,
    team1Wk: t1Wk,
    team2Capt: t2Capt,
    team2Wk: t2Wk
  };
  
  ScoringService.saveMatchSetup(currentScoringMatchId, setupData);
  
  alert('Match Setup saved successfully!');
  document.getElementById('btn_start_match').innerText = 'Update Match Setup';
  
  // Transition to scorecard summary
  switchModalTab('summary');
}
