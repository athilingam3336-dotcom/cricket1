// fixtureService.js
// Module 8: Assign Officials to Matches & Fixtures Display

const ASSIGNMENTS_STORAGE_KEY = 'cricket_match_assignments';

// Initialize assignments
if (!localStorage.getItem(ASSIGNMENTS_STORAGE_KEY)) {
  localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify({}));
}

const FixtureService = {
  getAssignments: () => JSON.parse(localStorage.getItem(ASSIGNMENTS_STORAGE_KEY) || '{}'),
  
  saveAssignments: (data) => localStorage.setItem(ASSIGNMENTS_STORAGE_KEY, JSON.stringify(data)),
  
  getMatchAssignments: (matchId) => {
    return FixtureService.getAssignments()[matchId] || [];
  },

  assignOfficial: (matchId, officialId, role, date, time) => {
    const allAssignments = FixtureService.getAssignments();
    
    // Check for double booking
    for (const mId in allAssignments) {
      if (mId !== matchId) {
        const assignments = allAssignments[mId];
        const hasConflict = assignments.some(a => a.officialId === officialId && a.date === date && a.time === time);
        if (hasConflict) {
          throw new Error("Double booking detected! This official is already assigned to another match at the exact same date and time.");
        }
      }
    }
    
    if (!allAssignments[matchId]) allAssignments[matchId] = [];
    
    // Check if role is already filled
    if (allAssignments[matchId].some(a => a.role === role)) {
      throw new Error(`The role of ${role} is already assigned for this match.`);
    }

    allAssignments[matchId].push({ officialId, role, date, time });
    FixtureService.saveAssignments(allAssignments);
  },

  removeAssignment: (matchId, officialId) => {
    const allAssignments = FixtureService.getAssignments();
    if (allAssignments[matchId]) {
      allAssignments[matchId] = allAssignments[matchId].filter(a => a.officialId !== officialId);
      FixtureService.saveAssignments(allAssignments);
    }
  }
};

// --- UI Logic ---
let currentMatchForAssignment = null;
let currentMatchDate = null;
let currentMatchTime = null;

function initFixturesUI() {
  // 1. Inject Advanced Filters
  const filtersContainer = document.querySelector('.match-filters');
  if (filtersContainer && !document.getElementById('adv_fixture_filters')) {
    const advFilters = document.createElement('div');
    advFilters.id = 'adv_fixture_filters';
    advFilters.style.cssText = 'display:flex; gap:10px; flex-wrap:wrap; margin-top:15px; width:100%;';
    advFilters.innerHTML = `
      <input type="date" id="filter_match_date" onchange="applyAdvancedFilters()" style="padding:6px; border-radius:4px; border:1px solid #444; background:rgba(0,0,0,0.3); color:#fff;">
      <input type="text" id="filter_match_venue" placeholder="Filter by Venue" onkeyup="applyAdvancedFilters()" style="padding:6px; border-radius:4px; border:1px solid #444; background:rgba(0,0,0,0.3); color:#fff; flex:1; min-width:150px;">
      <input type="text" id="filter_match_division" placeholder="Filter by Division/Category" onkeyup="applyAdvancedFilters()" style="padding:6px; border-radius:4px; border:1px solid #444; background:rgba(0,0,0,0.3); color:#fff; flex:1; min-width:150px;">
    `;
    filtersContainer.parentNode.insertBefore(advFilters, filtersContainer.nextSibling);
  }

  // 2. Setup Match Cards with dynamic IDs and Officials info
  document.querySelectorAll('.match-card').forEach((card, index) => {
    const matchId = card.dataset.matchId || ('M' + (index + 1));
    card.dataset.matchId = matchId;
    
    // Attempt to extract date/time for validation
    const statusNote = card.querySelector('.card-status-note');
    let dateStr = "Unknown Date";
    let timeStr = "Unknown Time";
    if (statusNote) {
      const text = statusNote.innerText;
      if (text.includes('at')) {
        const parts = text.split('at');
        dateStr = parts[0].replace('Tomorrow', new Date(Date.now() + 86400000).toISOString().split('T')[0]).trim();
        timeStr = parts[1].split('(')[0].trim();
      }
      card.dataset.matchDate = dateStr;
      card.dataset.matchTime = timeStr;
    }

    // Attempt to extract venue
    let venue = "Unknown Venue";
    const paragraphs = card.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (p.innerHTML.includes('fa-location-dot')) {
        venue = p.innerText.trim();
        card.dataset.matchVenue = venue;
      }
    });

    renderMatchOfficialsSection(card, matchId);
  });
}

function applyAdvancedFilters() {
  const dateF = document.getElementById('filter_match_date').value;
  const venueF = document.getElementById('filter_match_venue').value.toLowerCase();
  const divF = document.getElementById('filter_match_division').value.toLowerCase();
  
  // also respect the existing category filter (live/upcoming/results)
  const activeTab = document.querySelector('.filter-tab.active');
  const catFilter = activeTab ? activeTab.dataset.filter : 'all';

  document.querySelectorAll('.match-card').forEach(card => {
    let show = true;
    
    // Category check
    if (catFilter !== 'all' && card.dataset.category !== catFilter) show = false;
    
    // Date check (simple includes for now since dateStr might be 'Today', 'Tomorrow', etc)
    const cardDate = card.dataset.matchDate || '';
    if (dateF && !cardDate.includes(dateF)) show = false;
    
    // Venue check
    const cardVenue = (card.dataset.matchVenue || '').toLowerCase();
    if (venueF && !cardVenue.includes(venueF)) show = false;
    
    // Division/Tournament check
    const tourName = (card.querySelector('.card-tournament')?.innerText || '').toLowerCase();
    if (divF && !tourName.includes(divF)) show = false;
    
    card.style.display = show ? 'flex' : 'none';
  });
}

// Override the original filterMatches from script.js to call applyAdvancedFilters
const originalFilterMatches = window.filterMatches;
window.filterMatches = function(category) {
  if (originalFilterMatches) originalFilterMatches(category);
  applyAdvancedFilters();
};

function renderMatchOfficialsSection(card, matchId) {
  let officialsContainer = card.querySelector('.officials-container');
  if (!officialsContainer) {
    officialsContainer = document.createElement('div');
    officialsContainer.className = 'officials-container';
    officialsContainer.style.cssText = 'margin-top:15px; padding-top:10px; border-top:1px dashed rgba(255,255,255,0.1); font-size:12px;';
    
    const cardBottom = card.querySelector('.card-bottom') || card;
    if (cardBottom !== card) {
      cardBottom.parentNode.insertBefore(officialsContainer, cardBottom);
    } else {
      card.appendChild(officialsContainer);
    }
  }
  
  const assignments = FixtureService.getMatchAssignments(matchId);
  
  let html = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">';
  html += '<span style="color:#aaa;"><i class="fa-solid fa-users-viewfinder"></i> Match Officials</span>';
  html += `<button class="btn btn-sm btn-outline-gold" style="padding:2px 8px; font-size:11px;" onclick="openAssignOfficialsModal('${matchId}')">Assign</button>`;
  html += '</div>';
  
  if (assignments.length === 0) {
    html += '<div style="color:#ffb74d;">Not Assigned</div>';
  } else {
    html += '<ul style="list-style:none; padding:0; margin:0; display:flex; flex-wrap:wrap; gap:8px;">';
    assignments.forEach(a => {
      const official = OfficialService.getAll().find(o => o.id === a.officialId);
      const name = official ? official.name : 'Unknown';
      html += `<li style="background:rgba(255,255,255,0.05); padding:3px 6px; border-radius:4px;"><strong>${a.role}:</strong> ${name}</li>`;
    });
    html += '</ul>';
  }
  
  officialsContainer.innerHTML = html;
}

function openAssignOfficialsModal(matchId) {
  currentMatchForAssignment = matchId;
  const card = document.querySelector(`.match-card[data-match-id="${matchId}"]`);
  currentMatchDate = card ? card.dataset.matchDate : 'Unknown Date';
  currentMatchTime = card ? card.dataset.matchTime : 'Unknown Time';
  
  document.getElementById('modalAssignTitle').innerText = `Assign Officials - Match ${matchId}`;
  document.getElementById('assignMatchTimeInfo').innerText = `${currentMatchDate} • ${currentMatchTime}`;
  
  document.getElementById('assignOfficialsModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  renderAssignOfficialsList();
}

function closeAssignOfficialsModal() {
  document.getElementById('assignOfficialsModal').style.display = 'none';
  document.body.style.overflow = '';
  currentMatchForAssignment = null;
}

function renderAssignOfficialsList() {
  const assignments = FixtureService.getMatchAssignments(currentMatchForAssignment);
  const tbody = document.getElementById('assignOfficialsTableBody');
  tbody.innerHTML = '';
  
  // Show currently assigned
  if (assignments.length > 0) {
    assignments.forEach(a => {
      const official = OfficialService.getAll().find(o => o.id === a.officialId);
      const name = official ? official.name : 'Unknown';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding:8px;"><strong>${a.role}</strong></td>
        <td style="padding:8px;">${name}</td>
        <td style="padding:8px;">
          <button class="btn btn-sm btn-outline-primary" style="padding:2px 8px; color:#ff6b6b; border-color:#ff6b6b;" onclick="removeOfficialAssignment('${a.officialId}')">Remove</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } else {
    tbody.innerHTML = '<tr><td colspan="3" class="text-center" style="padding:10px; color:#888;">No officials assigned yet.</td></tr>';
  }
  
  // Populate dropdowns for new assignment
  const roleSelect = document.getElementById('assign_role');
  roleSelect.innerHTML = `
    <option value="">-- Select Role --</option>
    <option value="Umpire 1">Umpire 1</option>
    <option value="Umpire 2">Umpire 2</option>
    <option value="Third Umpire">Third Umpire</option>
    <option value="Match Referee">Match Referee</option>
    <option value="Scorer">Scorer</option>
  `;
  
  const officialSelect = document.getElementById('assign_official_id');
  officialSelect.innerHTML = '<option value="">-- Select Registered Official --</option>';
  
  const availableOfficials = OfficialService.getAll().filter(o => o.status === 'Active');
  availableOfficials.forEach(o => {
    officialSelect.innerHTML += `<option value="${o.id}">${o.name} (${o.type} - ${o.district})</option>`;
  });
}

function handleAssignOfficialSubmit(e) {
  e.preventDefault();
  const role = document.getElementById('assign_role').value;
  const officialId = document.getElementById('assign_official_id').value;
  
  if (!role || !officialId) return;
  
  try {
    FixtureService.assignOfficial(currentMatchForAssignment, officialId, role, currentMatchDate, currentMatchTime);
    renderAssignOfficialsList();
    
    // Update the card UI
    const card = document.querySelector(`.match-card[data-match-id="${currentMatchForAssignment}"]`);
    if (card) renderMatchOfficialsSection(card, currentMatchForAssignment);
    
  } catch (err) {
    alert(err.message);
  }
}

function removeOfficialAssignment(officialId) {
  if (confirm('Remove this official from the match?')) {
    FixtureService.removeAssignment(currentMatchForAssignment, officialId);
    renderAssignOfficialsList();
    
    const card = document.querySelector(`.match-card[data-match-id="${currentMatchForAssignment}"]`);
    if (card) renderMatchOfficialsSection(card, currentMatchForAssignment);
  }
}

// Bind events
document.addEventListener('DOMContentLoaded', () => {
  // Initialize fixtures UI after a short delay to ensure DOM is ready
  setTimeout(() => {
    initFixturesUI();
  }, 100);

  const modal = document.getElementById('assignOfficialsModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAssignOfficialsModal();
      }
    });
  }
});
