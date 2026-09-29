// playerService.js
// Module 3: Player Registration with Document Upload & Team Selection
// Also lays groundwork for Module 4 (category registration open/close)

// ─── Category Registration Settings (Module 4) ──────────────────
const DEFAULT_CATEGORIES = [
  { id: 'player_senior', label: 'Senior Player', gender: 'All', isOpen: true, maxAge: 99 },
  { id: 'player_u23_u25', label: 'U-23 / U-25', gender: 'All', isOpen: false, maxAge: 25 },
  { id: 'player_womens', label: 'Women\'s (Open)', gender: 'Female', isOpen: true, maxAge: 99 },
  { id: 'player_womens_u19', label: 'Women\'s U-19', gender: 'Female', isOpen: false, maxAge: 19 },
  { id: 'player_womens_u16', label: 'Women\'s U-16', gender: 'Female', isOpen: false, maxAge: 16 },
  { id: 'player_womens_u14', label: 'Women\'s U-14', gender: 'Female', isOpen: false, maxAge: 14 },
  { id: 'player_u19', label: 'Junior U-19', gender: 'All', isOpen: false, maxAge: 19 },
  { id: 'player_u16', label: 'Junior U-16', gender: 'All', isOpen: false, maxAge: 16 },
  { id: 'player_u14', label: 'Junior U-14', gender: 'All', isOpen: false, maxAge: 14 },
  { id: 'academy_admission', label: 'District Academy Coaching', gender: 'All', isOpen: true, maxAge: 99 },
  { id: 'club_affiliation', label: 'New Cricket Club Affiliation', gender: 'All', isOpen: false, maxAge: 99 },
  { id: 'umpire_scorer', label: 'Umpire / Scorer Accreditation', gender: 'All', isOpen: false, maxAge: 99 }
];

const CATEGORY_STORAGE_KEY = 'cricket_categories';
if (!localStorage.getItem(CATEGORY_STORAGE_KEY)) {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
}

const CategoryService = {
  getAll: () => JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]'),
  save: (data) => localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(data)),
  isOpen: (catId) => {
    const cat = CategoryService.getAll().find(c => c.id === catId);
    return cat ? cat.isOpen : false;
  },
  toggleOpen: (catId, isOpen) => {
    const all = CategoryService.getAll();
    const idx = all.findIndex(c => c.id === catId);
    if (idx !== -1) { all[idx].isOpen = isOpen; CategoryService.save(all); }
  }
};

// ─── Player Data ────────────────────────────────────────────────────────────
const PLAYER_STORAGE_KEY = 'cricket_players';
const INITIAL_PLAYERS = [
  {
    id: 'P1001', fullName: 'K. Praveen Kumar', dob: '2000-05-14',
    category: 'player_senior', taluk: 'Virudhunagar', speciality: 'Top Order Batter',
    mobile: '9443000001', stateAssocId: 'SA-VRD-2025-089', gender: 'Male',
    documents: { aadhaar: 'aadhaar_praveen.pdf', birthCert: 'birth_cert_praveen.pdf', photo: 'photo_praveen.jpg' },
    documentsUploaded: true,
    selectedTeamId: '1001', selectedTeamName: 'Virudhunagar Cricket Club', selectedTeamType: 'Club',
    status: 'Confirmed', createdAt: '2025-07-01T09:00:00Z'
  },
  {
    id: 'P1002', fullName: 'S. Meena', dob: '2008-11-22',
    category: 'player_junior', taluk: 'Sivakasi', speciality: 'Spin Bowler',
    mobile: '9443000002', stateAssocId: '', gender: 'Female',
    documents: { aadhaar: 'aadhaar_meena.pdf', birthCert: '', photo: 'photo_meena.jpg' },
    documentsUploaded: true,
    selectedTeamId: '1002', selectedTeamName: 'KVS Higher Secondary School', selectedTeamType: 'School',
    status: 'Confirmed', createdAt: '2025-08-10T11:30:00Z'
  },
  {
    id: 'P1003', fullName: 'R. Aravind', dob: '2005-03-08',
    category: 'player_junior', taluk: 'Rajapalayam', speciality: 'All-Rounder',
    mobile: '9443000003', stateAssocId: '', gender: 'Male',
    documents: {},
    documentsUploaded: false,
    selectedTeamId: '', selectedTeamName: '', selectedTeamType: '',
    status: 'Documents Pending', createdAt: '2025-09-01T16:00:00Z'
  }
];

if (!localStorage.getItem(PLAYER_STORAGE_KEY)) {
  localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(INITIAL_PLAYERS));
}

const PlayerService = {
  getAll: () => JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) || '[]'),
  save: (data) => localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(data)),

  add: (player) => {
    const all = PlayerService.getAll();
    player.id = 'P' + Date.now().toString();
    player.documents = {};
    player.documentsUploaded = false;
    player.selectedTeamId = '';
    player.selectedTeamName = '';
    player.selectedTeamType = '';
    player.status = 'Documents Pending';
    player.createdAt = new Date().toISOString();
    all.push(player);
    PlayerService.save(all);
    return player;
  },

  getById: (id) => PlayerService.getAll().find(p => p.id === id) || null,

  updateDocuments: (id, docs) => {
    const all = PlayerService.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) {
      all[idx].documents = { ...all[idx].documents, ...docs };
      // Check if minimum required docs are present (aadhaar + photo)
      const d = all[idx].documents;
      all[idx].documentsUploaded = !!(d.aadhaar && d.photo);
      if (all[idx].documentsUploaded && all[idx].status === 'Documents Pending') {
        all[idx].status = 'Documents Uploaded';
      }
      PlayerService.save(all);
    }
    return PlayerService.getById(id);
  },

  selectTeam: (playerId, teamId, teamName, teamType) => {
    const all = PlayerService.getAll();
    const idx = all.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      all[idx].selectedTeamId = teamId;
      all[idx].selectedTeamName = teamName;
      all[idx].selectedTeamType = teamType;
      all[idx].status = 'Pending';
      PlayerService.save(all);
    }
  },

  confirmPlayer: (id) => {
    const all = PlayerService.getAll();
    const idx = all.findIndex(p => p.id === id);
    if (idx !== -1) {
      all[idx].status = 'Confirmed';
      PlayerService.save(all);
    }
  }
};

// ─── Current registration session ───────────────────────────────────────────
let currentPlayerId = null;
let currentRegStep = 1;

// ─── Step 1: Player Details ─────────────────────────────────────────────────
// Override existing registration form submission
function handleRegistrationSubmit(e) {
  e.preventDefault();

  const category = document.getElementById('reg_type').value;
  const fullName = document.getElementById('reg_fullname').value.trim();
  const dob = document.getElementById('reg_dob').value;
  const taluk = document.getElementById('reg_taluk').value;
  const speciality = document.getElementById('reg_speciality').value;
  const mobile = document.getElementById('reg_mobile').value.trim();
  const stateAssocId = document.getElementById('reg_state-assoc_id').value.trim();
  const gender = document.getElementById('reg_gender') ? document.getElementById('reg_gender').value : 'Male';

  // Check if category registration is open
  const catDef = CategoryService.getAll().find(c => c.id === category);
  if (!catDef || !catDef.isOpen) {
    alert('⚠️ Registration for this category is currently closed. Registration opens when this tournament starts.');
    return;
  }

  // Validate Gender
  if (catDef.gender !== 'All' && gender !== catDef.gender) {
    alert(`⚠️ This category is restricted to ${catDef.gender} players only.`);
    return;
  }

  // Validate Age
  if (dob) {
    const dobDate = new Date(dob);
    const ageDifMs = Date.now() - dobDate.getTime();
    const ageDate = new Date(ageDifMs); 
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    
    if (age > catDef.maxAge) {
      alert(`⚠️ You are too old for this category. The maximum age for ${catDef.label} is ${catDef.maxAge}. Your current age is ${age}.`);
      return;
    }
  }

  const player = PlayerService.add({
    fullName, dob, category, taluk, speciality, mobile, stateAssocId, gender
  });

  currentPlayerId = player.id;
  currentRegStep = 2;

  // Hide the form step, show document upload step
  document.getElementById('regStep1').style.display = 'none';
  document.getElementById('regStep2').style.display = 'block';
  document.getElementById('regStep3').style.display = 'none';
  updateStepIndicators();
  updateRegSuccessBar(`✓ Details saved! Reference ID: <strong>${player.id}</strong>. Now upload your documents.`);
}

// ─── Step 2: Document Upload ────────────────────────────────────────────────
function handleDocUpload(e) {
  e.preventDefault();
  if (!currentPlayerId) return;

  const aadhaarInput = document.getElementById('doc_aadhaar');
  const birthCertInput = document.getElementById('doc_birth_cert');
  const photoInput = document.getElementById('doc_photo');

  const docs = {};
  if (aadhaarInput.files.length > 0) docs.aadhaar = aadhaarInput.files[0].name;
  if (birthCertInput.files.length > 0) docs.birthCert = birthCertInput.files[0].name;
  if (photoInput.files.length > 0) docs.photo = photoInput.files[0].name;

  if (!docs.aadhaar || !docs.photo) {
    document.getElementById('docUploadError').innerText = 'Aadhaar/ID Proof and Photo are required.';
    document.getElementById('docUploadError').style.display = 'block';
    return;
  }

  document.getElementById('docUploadError').style.display = 'none';
  const player = PlayerService.updateDocuments(currentPlayerId, docs);

  if (player && player.documentsUploaded) {
    currentRegStep = 3;
    document.getElementById('regStep2').style.display = 'none';
    document.getElementById('regStep3').style.display = 'block';
    updateStepIndicators();
    updateRegSuccessBar('✓ Documents uploaded successfully! Now choose your team.');
    populateTeamSelection();
  }
}

// ─── Step 3: Team Selection ─────────────────────────────────────────────────
function populateTeamSelection() {
  const player = PlayerService.getById(currentPlayerId);
  if (!player) return;

  // Get approved organizations from Module 2
  const orgs = typeof OrgService !== 'undefined' ? OrgService.getAll().filter(o => o.status === 'Approved') : [];

  const container = document.getElementById('teamSelectionList');
  container.innerHTML = '';

  if (orgs.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No approved teams available at this time.</p>';
    return;
  }

  orgs.forEach(org => {
    const typeBadge = getTeamTypeBadge(org.orgType);
    const card = document.createElement('div');
    card.className = 'team-select-card';
    card.dataset.teamId = org.id;
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
        <div style="width:40px; height:40px; border-radius:50%; background:rgba(212,175,55,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i class="fa-solid ${getTeamIcon(org.orgType)}" style="color:var(--gold-primary, #d4af37); font-size:18px;"></i>
        </div>
        <div style="min-width:0;">
          <strong style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${org.name}</strong>
          <small style="color:#999;">${typeBadge} • ${org.district || '—'}</small>
        </div>
      </div>
      <button class="btn btn-sm btn-outline-primary" style="padding:6px 14px; font-size:12px; flex-shrink:0;" onclick="selectTeam('${org.id}', '${escapeQuotes(org.name)}', '${org.orgType}')">
        <i class="fa-solid fa-check-circle"></i> Select
      </button>
    `;
    container.appendChild(card);
  });
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function getTeamIcon(type) {
  const icons = { Club: 'fa-shield', School: 'fa-school', College: 'fa-university', Academy: 'fa-graduation-cap' };
  return icons[type] || 'fa-building';
}

function getTeamTypeBadge(type) {
  const colors = { Club: '#4fc3f7', School: '#81c784', College: '#ffb74d', Academy: '#ce93d8' };
  const bg = colors[type] || '#888';
  return `<span style="color:${bg}; font-weight:600;">${type}</span>`;
}

function selectTeam(teamId, teamName, teamType) {
  if (!currentPlayerId) return;
  if (!confirm(`Confirm: You are selecting "${teamName}" (${teamType}) as your team. You can only be linked to one team per category. Proceed?`)) return;

  PlayerService.selectTeam(currentPlayerId, teamId, teamName, teamType);
  updateRegSuccessBar(`🎉 Registration complete! You are now linked to <strong>${teamName}</strong> (${teamType}).`);

  // Replace the team list with a confirmation card
  const container = document.getElementById('teamSelectionList');
  container.innerHTML = `
    <div style="text-align:center; padding:30px;">
      <div style="width:70px; height:70px; border-radius:50%; background:rgba(40,167,69,0.15); display:inline-flex; align-items:center; justify-content:center; margin-bottom:15px;">
        <i class="fa-solid fa-check-circle" style="font-size:36px; color:#81c784;"></i>
      </div>
      <h4 style="color:#fff; margin-bottom:8px;">Registration Complete!</h4>
      <p style="color:#aaa; margin-bottom:5px;">You have been registered with:</p>
      <p style="color:var(--gold-primary, #d4af37); font-size:18px; font-weight:700;">${teamName}</p>
      <small style="color:#888;">${teamType} • Reference: ${currentPlayerId}</small>
      <div style="margin-top:20px;">
        <button class="btn btn-outline-gold" onclick="openPlayerProfileModal('${currentPlayerId}')"><i class="fa-solid fa-user"></i> View Profile</button>
        <button class="btn btn-outline-primary" style="margin-left:8px;" onclick="closeModal('registrationModal')">Close</button>
      </div>
    </div>
  `;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function updateStepIndicators() {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById('stepIndicator' + i);
    if (!el) continue;
    el.classList.remove('active', 'completed');
    if (i < currentRegStep) el.classList.add('completed');
    else if (i === currentRegStep) el.classList.add('active');
  }
}

function updateRegSuccessBar(msg) {
  const bar = document.getElementById('regStepSuccessBar');
  if (bar) {
    bar.innerHTML = msg;
    bar.style.display = 'block';
  }
}

function resetRegistrationWizard() {
  currentPlayerId = null;
  currentRegStep = 1;
  document.getElementById('regStep1').style.display = 'block';
  document.getElementById('regStep2').style.display = 'none';
  document.getElementById('regStep3').style.display = 'none';
  const bar = document.getElementById('regStepSuccessBar');
  if (bar) bar.style.display = 'none';
  const err = document.getElementById('docUploadError');
  if (err) err.style.display = 'none';
  updateStepIndicators();
}

// ─── Player Profile Modal ───────────────────────────────────────────────────
function openPlayerProfileModal(playerId) {
  const player = PlayerService.getById(playerId);
  if (!player) { alert('Player not found.'); return; }

  const modal = document.getElementById('playerProfileModal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  const catLabel = getCategoryLabel(player.category);
  const statusBadge = getPlayerStatusBadge(player.status);
  const teamInfo = player.selectedTeamId
    ? `<strong style="color:var(--gold-primary, #d4af37);">${player.selectedTeamName}</strong> <small>(${player.selectedTeamType})</small>`
    : '<em style="color:#666;">Not selected yet</em>';

  const docStatus = player.documentsUploaded
    ? '<span class="badge green">Uploaded</span>'
    : '<span class="badge red">Pending</span>';

  const docList = player.documents && Object.keys(player.documents).length > 0
    ? Object.entries(player.documents).map(([k, v]) => v ? `<span style="display:inline-block; padding:2px 8px; margin:2px; border-radius:10px; background:rgba(255,255,255,0.06); font-size:11px;"><i class="fa-solid fa-file"></i> ${v}</span>` : '').join('')
    : '<em style="color:#666;">No documents</em>';

  const confirmAction = player.status === 'Pending' 
    ? `<div style="margin-top:20px; padding-top:15px; border-top:1px solid rgba(212,175,55,0.3); text-align:right;"><button class="btn btn-primary" onclick="handlePlayerConfirm('${player.id}')"><i class="fa-solid fa-check"></i> Confirm & Add to Squad</button></div>` 
    : '';

  const statsHtml = typeof PerformanceService !== 'undefined' ? PerformanceService.renderPlayerStatsHTML(player.id) : '';

  document.getElementById('playerProfileContent').innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
      <div>${statusBadge}</div>
      <small style="color:#888;">ID: ${player.id} • ${new Date(player.createdAt).toLocaleDateString()}</small>
    </div>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td style="padding:8px 12px; color:#aaa; width:160px;">Full Name</td><td style="padding:8px 12px; font-weight:600;">${player.fullName}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Category</td><td style="padding:8px 12px;">${catLabel}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Date of Birth</td><td style="padding:8px 12px;">${player.dob}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Taluk / Area</td><td style="padding:8px 12px;">${player.taluk}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Playing Role</td><td style="padding:8px 12px;">${player.speciality}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Mobile</td><td style="padding:8px 12px;">${player.mobile}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Gender</td><td style="padding:8px 12px;">${player.gender || '—'}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Documents</td><td style="padding:8px 12px;">${docStatus}<br>${docList}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Selected Team</td><td style="padding:8px 12px;">${teamInfo}</td></tr>
    </table>
    ${confirmAction}
    ${statsHtml}
  `;
}

function handlePlayerConfirm(id) {
  if (confirm('Are you sure you want to confirm this player? They will be automatically verified and added to their selected team\'s squad.')) {
    PlayerService.confirmPlayer(id);
    openPlayerProfileModal(id);
    if (document.getElementById('playerListModal').style.display === 'flex') {
      renderPlayerList();
    }
  }
}

function closePlayerProfileModal() {
  document.getElementById('playerProfileModal').style.display = 'none';
  document.body.style.overflow = '';
}

function getCategoryLabel(catId) {
  const cat = CategoryService.getAll().find(c => c.id === catId);
  return cat ? cat.label : catId;
}

function getPlayerStatusBadge(status) {
  if (status === 'Confirmed') return '<span class="badge green">Confirmed (Squad)</span>';
  if (status === 'Pending') return '<span class="badge gold">Pending Approval</span>';
  if (status === 'Documents Uploaded') return '<span class="badge" style="background:#555; color:#fff;">Docs Uploaded</span>';
  return '<span class="badge red">Documents Pending</span>';
}

// ─── Player Lookup (from Admin → View Registrations) ────────────────────────
function openPlayerListModal() {
  document.getElementById('playerListModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  renderPlayerList();
}

function closePlayerListModal() {
  document.getElementById('playerListModal').style.display = 'none';
  document.body.style.overflow = '';
}

function renderPlayerList() {
  const searchTerm = document.getElementById('playerListSearch') ? document.getElementById('playerListSearch').value.toLowerCase() : '';
  let players = PlayerService.getAll();
  if (searchTerm) {
    players = players.filter(p => p.fullName.toLowerCase().includes(searchTerm) || p.id.toLowerCase().includes(searchTerm));
  }

  const tbody = document.getElementById('playerListTableBody');
  tbody.innerHTML = '';

  if (players.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px;">No player registrations found.</td></tr>';
    return;
  }

  players.forEach(p => {
    const statusBadge = getPlayerStatusBadge(p.status);
    const team = p.selectedTeamName || '<em style="color:#666;">—</em>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.fullName}</strong><br><small style="color:#999;">${p.id}</small></td>
      <td>${getCategoryLabel(p.category)}</td>
      <td>${p.taluk}</td>
      <td>${team}</td>
      <td>${statusBadge}</td>
      <td><button class="btn btn-sm btn-outline-primary" style="padding:4px 8px; font-size:12px;" onclick="openPlayerProfileModal('${p.id}')"><i class="fa-solid fa-eye"></i> View</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ─── Bind close events ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['playerProfileModal', 'playerListModal'].forEach(modalId => {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
    }
  });

  // Populate dynamic category dropdown
  populateCategoriesDropdown();
});

function populateCategoriesDropdown() {
  const select = document.getElementById('reg_type');
  if (!select) return;
  select.innerHTML = '';
  const cats = CategoryService.getAll();
  cats.forEach(c => {
    const option = document.createElement('option');
    option.value = c.id;
    if (c.isOpen) {
      option.textContent = c.label;
    } else {
      option.textContent = `🔒 ${c.label} (Closed)`;
      option.disabled = true;
    }
    select.appendChild(option);
  });
}
