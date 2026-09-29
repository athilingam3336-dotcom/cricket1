// tournamentService.js
// Module 6: Tournament Management

const TOURNAMENT_STORAGE_KEY = 'cricket_tournaments';

const TournamentService = {
  getAll: () => JSON.parse(localStorage.getItem(TOURNAMENT_STORAGE_KEY) || '[]'),
  save: (data) => localStorage.setItem(TOURNAMENT_STORAGE_KEY, JSON.stringify(data)),
  add: (tour) => {
    const all = TournamentService.getAll();
    tour.id = 'T' + Date.now();
    tour.createdAt = new Date().toISOString();
    all.push(tour);
    TournamentService.save(all);
    return tour;
  }
};

let currentDivisions = [];
let editingTournamentId = null;
let lastSelectedFormat = "";

function openManageTournamentModal() {
  document.getElementById('manageTournamentModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  resetTournamentForm();
  renderExistingTournaments();
}

function closeManageTournamentModal() {
  document.getElementById('manageTournamentModal').style.display = 'none';
  document.body.style.overflow = '';
}

function resetTournamentForm() {
  document.getElementById('tournamentSetupForm').reset();
  currentDivisions = [];
  editingTournamentId = null;
  lastSelectedFormat = "";
  document.getElementById('tour_divisions_section').style.display = 'none';
  renderDivisions();
}

function handleTourFormatChange() {
  const formatSelect = document.getElementById('tour_format');
  const newFormat = formatSelect.value;
  
  if (currentDivisions.length > 0 && lastSelectedFormat !== "") {
    if (!confirm('Changing the format will reset your current division setup. Are you sure?')) {
      formatSelect.value = lastSelectedFormat;
      return;
    }
    // User confirmed, reset divisions
    currentDivisions = [];
    renderDivisions();
  }
  
  lastSelectedFormat = newFormat;
  
  if (newFormat) {
    document.getElementById('tour_divisions_section').style.display = 'block';
    if (currentDivisions.length === 0) {
      addTournamentDivision(); // Add a default division when format is selected
    }
  } else {
    document.getElementById('tour_divisions_section').style.display = 'none';
  }
}

function addTournamentDivision() {
  const divId = 'DIV_' + Date.now() + Math.floor(Math.random() * 1000);
  currentDivisions.push({
    id: divId,
    name: 'Division ' + (currentDivisions.length + 1),
    teams: []
  });
  renderDivisions();
}

function removeTournamentDivision(divId) {
  currentDivisions = currentDivisions.filter(d => d.id !== divId);
  renderDivisions();
}

function updateDivisionName(divId, newName) {
  const div = currentDivisions.find(d => d.id === divId);
  if (div) div.name = newName;
}

function toggleTeamInDivision(divId, teamId) {
  const div = currentDivisions.find(d => d.id === divId);
  if (!div) return;
  
  // A team can only be in one division per tournament. 
  // Let's remove it from any other division first.
  currentDivisions.forEach(d => {
    d.teams = d.teams.filter(t => t !== teamId);
  });
  
  if (!div.teams.includes(teamId)) {
    div.teams.push(teamId);
  } else {
    div.teams = div.teams.filter(t => t !== teamId);
  }
  renderDivisions();
}

function renderDivisions() {
  const list = document.getElementById('tour_divisions_list');
  if (!list) return;
  list.innerHTML = '';
  
  // Get available approved teams
  const allTeams = typeof OrgService !== 'undefined' ? OrgService.getAll().filter(o => o.status === 'Approved') : [];
  
  currentDivisions.forEach((div, index) => {
    const divEl = document.createElement('div');
    divEl.style.cssText = 'background: rgba(0,0,0,0.2); padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05);';
    
    let teamsHtml = '<div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:8px;">';
    if (allTeams.length === 0) {
      teamsHtml += '<span style="font-size:12px; color:#888;">No approved teams available.</span>';
    } else {
      allTeams.forEach(team => {
        const isSelected = div.teams.includes(team.id);
        const bg = isSelected ? '#d4af37' : 'rgba(255,255,255,0.1)';
        const color = isSelected ? '#000' : '#fff';
        teamsHtml += `
          <button type="button" onclick="toggleTeamInDivision('${div.id}', '${team.id}')" 
                  style="padding:4px 8px; border-radius:12px; font-size:11px; cursor:pointer; background:${bg}; color:${color}; border:none;">
            ${team.name}
          </button>
        `;
      });
    }
    teamsHtml += '</div>';

    divEl.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 5px;">
        <input type="text" value="${div.name}" onchange="updateDivisionName('${div.id}', this.value)" style="width: 200px; padding: 4px 8px; background: rgba(0,0,0,0.3); color: #fff; border: 1px solid #444; border-radius: 4px;" placeholder="Division Name">
        <button type="button" class="btn btn-sm btn-outline-gold" style="padding: 2px 8px; color:#ff6b6b; border-color:#ff6b6b;" onclick="removeTournamentDivision('${div.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div style="font-size: 12px; color:#aaa;">Assign Teams:</div>
      ${teamsHtml}
    `;
    list.appendChild(divEl);
  });
}

function handleTournamentSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('tour_name').value.trim();
  const startDate = document.getElementById('tour_start_date').value;
  const endDate = document.getElementById('tour_end_date').value;
  const format = document.getElementById('tour_format').value;
  
  if (!format) {
    alert('Please select a tournament format.');
    return;
  }
  
  if (currentDivisions.length === 0) {
    alert('Please add at least one division and assign teams.');
    return;
  }
  
  const tour = {
    name,
    startDate,
    endDate,
    format,
    divisions: currentDivisions,
    status: 'Upcoming'
  };
  
  TournamentService.add(tour);
  alert('Tournament saved successfully!');
  resetTournamentForm();
  renderExistingTournaments();
}

function renderExistingTournaments() {
  const list = document.getElementById('existingTournamentsList');
  if (!list) return;
  
  const tours = TournamentService.getAll();
  if (tours.length === 0) {
    list.innerHTML = '<p style="color:#888;">No tournaments created yet.</p>';
    return;
  }
  
  let html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">';
  html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#aaa;"><th style="padding:8px; text-align:left;">Tournament</th><th style="padding:8px; text-align:left;">Format</th><th style="padding:8px; text-align:left;">Divisions</th></tr>';
  
  tours.forEach(t => {
    html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
      <td style="padding:8px;"><strong>${t.name}</strong><br><small style="color:#999;">${t.startDate}</small></td>
      <td style="padding:8px;"><span class="badge" style="background:rgba(255,255,255,0.1); color:#fff;">${t.format}</span></td>
      <td style="padding:8px;">${t.divisions.map(d => `${d.name} (${d.teams.length} teams)`).join('<br>')}</td>
    </tr>`;
  });
  
  html += '</table>';
  list.innerHTML = html;
}

// Bind modal close to overlay click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('manageTournamentModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeManageTournamentModal();
      }
    });
  }
});
