// orgRegistrationService.js
// Module 2: Club / School / College / Academy Registration

// ─── Sample Data ────────────────────────────────────────────────────────────
const INITIAL_ORGS = [
  { id: '1001', orgType: 'Club', name: 'Virudhunagar Cricket Club', regNumber: 'VCC-2024-001', district: 'Virudhunagar', address: '12 Stadium Road, Virudhunagar', contactPerson: 'K. Subramanian', phone: '9876543220', email: 'info@virudhunagar-cc.org', logoFileName: '', affiliationProofFileName: '', idProofFileName: '', collegeId: '', status: 'Approved', rejectionReason: '', createdAt: '2025-06-15T10:30:00Z' },
  { id: '1002', orgType: 'School', name: 'KVS Higher Secondary School', regNumber: 'KVS-SCH-2024-002', district: 'Sivakasi', address: '45 Main Street, Sivakasi', contactPerson: 'R. Meenakshi', phone: '9876543221', email: 'sports@kvs-school.edu', logoFileName: '', affiliationProofFileName: '', idProofFileName: '', collegeId: '', status: 'Approved', rejectionReason: '', createdAt: '2025-07-01T09:00:00Z' },
  { id: '1003', orgType: 'College', name: 'Engineering College A', regNumber: 'ECA-COL-2024-003', district: 'Virudhunagar', address: '123 Edu Street', contactPerson: 'John Doe', phone: '9876543210', email: 'john@eca.edu', logoFileName: '', affiliationProofFileName: '', idProofFileName: '', collegeId: '1', status: 'Pending', rejectionReason: '', createdAt: '2025-08-12T14:20:00Z' },
  { id: '1004', orgType: 'Academy', name: 'Rajapalayam Cricket Academy', regNumber: 'RCA-ACD-2024-004', district: 'Rajapalayam', address: '99 Sports Complex', contactPerson: 'M. Aravind', phone: '9876543222', email: 'rca@cricket-academy.in', logoFileName: '', affiliationProofFileName: '', idProofFileName: '', collegeId: '', status: 'Rejected', rejectionReason: 'Incomplete affiliation documents. Please resubmit with valid proof.', createdAt: '2025-09-05T11:15:00Z' },
  { id: '1005', orgType: 'Club', name: 'Sattur Young Cricketers', regNumber: 'SYC-2024-005', district: 'Sattur', address: '78 Ground Lane, Sattur', contactPerson: 'P. Marimuthu', phone: '9876543223', email: 'sattur.yc@gmail.com', logoFileName: '', affiliationProofFileName: '', idProofFileName: '', collegeId: '', status: 'Approved', rejectionReason: '', createdAt: '2025-06-20T08:45:00Z' }
];

const ORG_STORAGE_KEY = 'cricket_organizations';

if (!localStorage.getItem(ORG_STORAGE_KEY)) {
  localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(INITIAL_ORGS));
}

// ─── Service Layer ──────────────────────────────────────────────────────────
const OrgService = {
  getAll: () => JSON.parse(localStorage.getItem(ORG_STORAGE_KEY) || '[]'),
  save: (data) => localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(data)),

  add: (org) => {
    const all = OrgService.getAll();
    org.id = Date.now().toString();
    org.status = 'Pending';
    org.rejectionReason = '';
    org.createdAt = new Date().toISOString();
    all.push(org);
    OrgService.save(all);
    return org;
  },

  getById: (id) => {
    return OrgService.getAll().find(o => o.id === id) || null;
  },

  approve: (id) => {
    const all = OrgService.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx !== -1) {
      all[idx].status = 'Approved';
      all[idx].rejectionReason = '';
      OrgService.save(all);
    }
  },

  reject: (id, reason) => {
    const all = OrgService.getAll();
    const idx = all.findIndex(o => o.id === id);
    if (idx !== -1) {
      all[idx].status = 'Rejected';
      all[idx].rejectionReason = reason || 'No reason provided.';
      OrgService.save(all);
    }
  },

  delete: (id) => {
    let all = OrgService.getAll();
    all = all.filter(o => o.id !== id);
    OrgService.save(all);
  }
};

// ─── Registration Modal UI ─────────────────────────────────────────────────

function openOrgRegistrationModal() {
  document.getElementById('orgRegistrationModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  document.getElementById('orgRegForm').reset();
  document.getElementById('orgRegError').style.display = 'none';
  document.getElementById('orgRegSuccess').style.display = 'none';
  handleOrgTypeChange(); // set up initial college selector visibility
}

function closeOrgRegistrationModal() {
  document.getElementById('orgRegistrationModal').style.display = 'none';
  document.body.style.overflow = '';
}

function handleOrgTypeChange() {
  const type = document.getElementById('org_type').value;
  const collegeSection = document.getElementById('orgCollegeSelectSection');
  if (type === 'College') {
    collegeSection.style.display = 'block';
    populateCollegeDropdown();
  } else {
    collegeSection.style.display = 'none';
  }
}

function populateCollegeDropdown() {
  const select = document.getElementById('org_college_select');
  const colleges = typeof CollegeService !== 'undefined' ? CollegeService.getColleges() : [];
  select.innerHTML = '<option value="">-- Select a College --</option>';
  colleges.filter(c => c.status === 'Active').forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.name} (${c.code})</option>`;
  });
}

function handleOrgRegSubmit(event) {
  event.preventDefault();
  const errorDiv = document.getElementById('orgRegError');
  const successDiv = document.getElementById('orgRegSuccess');
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';

  const orgType = document.getElementById('org_type').value;
  const name = document.getElementById('org_name').value.trim();
  const regNumber = document.getElementById('org_regnum').value.trim();
  const district = document.getElementById('org_district').value;
  const address = document.getElementById('org_address').value.trim();
  const contactPerson = document.getElementById('org_contact').value.trim();
  const phone = document.getElementById('org_phone').value.trim();
  const email = document.getElementById('org_email').value.trim();
  const collegeId = orgType === 'College' ? document.getElementById('org_college_select').value : '';

  // File names (we store only the name since there is no real backend)
  const logoInput = document.getElementById('org_logo');
  const affiliationInput = document.getElementById('org_affiliation_proof');
  const idProofInput = document.getElementById('org_id_proof');
  const logoFileName = logoInput.files.length > 0 ? logoInput.files[0].name : '';
  const affiliationProofFileName = affiliationInput.files.length > 0 ? affiliationInput.files[0].name : '';
  const idProofFileName = idProofInput.files.length > 0 ? idProofInput.files[0].name : '';

  // Validation
  if (!name || !regNumber) {
    errorDiv.innerText = 'Organization Name and Registration Number are required.';
    errorDiv.style.display = 'block';
    return;
  }

  if (orgType === 'College' && !collegeId) {
    errorDiv.innerText = 'Please select a college from the dropdown.';
    errorDiv.style.display = 'block';
    return;
  }

  const phoneRegex = /^[0-9]{10}$/;
  if (phone && !phoneRegex.test(phone)) {
    errorDiv.innerText = 'Phone must be a 10-digit number.';
    errorDiv.style.display = 'block';
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errorDiv.innerText = 'Invalid email format.';
    errorDiv.style.display = 'block';
    return;
  }

  const orgData = {
    orgType, name, regNumber, district, address, contactPerson,
    phone, email, logoFileName, affiliationProofFileName, idProofFileName, collegeId
  };

  try {
    OrgService.add(orgData);
    successDiv.innerHTML = '<i class="fa-solid fa-check-circle"></i> Registration submitted successfully! Status: <strong>Pending Approval</strong>. You will be notified once reviewed.';
    successDiv.style.display = 'block';
    document.getElementById('orgRegForm').reset();
    handleOrgTypeChange();
  } catch (err) {
    errorDiv.innerText = err.message;
    errorDiv.style.display = 'block';
  }
}

// ─── Listing Modal UI ───────────────────────────────────────────────────────

function openOrgListingModal() {
  document.getElementById('orgListingModal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  renderOrgListing();
}

function closeOrgListingModal() {
  document.getElementById('orgListingModal').style.display = 'none';
  document.body.style.overflow = '';
}

function renderOrgListing() {
  const typeFilter = document.getElementById('orgFilter_type').value;
  const districtFilter = document.getElementById('orgFilter_district').value;
  const statusFilter = document.getElementById('orgFilter_status').value;
  const searchTerm = document.getElementById('orgFilter_search').value.toLowerCase();

  let orgs = OrgService.getAll();

  if (typeFilter) orgs = orgs.filter(o => o.orgType === typeFilter);
  if (districtFilter) orgs = orgs.filter(o => o.district === districtFilter);
  if (statusFilter) orgs = orgs.filter(o => o.status === statusFilter);
  if (searchTerm) orgs = orgs.filter(o => o.name.toLowerCase().includes(searchTerm) || o.regNumber.toLowerCase().includes(searchTerm));

  const tbody = document.getElementById('orgListingTableBody');
  tbody.innerHTML = '';

  if (orgs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 20px;">No organizations found matching the criteria.</td></tr>';
    return;
  }

  orgs.forEach(o => {
    const typeBadge = getOrgTypeBadge(o.orgType);
    const statusBadge = getOrgStatusBadge(o.status);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${typeBadge}</td>
      <td><strong>${o.name}</strong><br><small style="color: #999;">${o.regNumber}</small></td>
      <td>${o.district || '—'}</td>
      <td>${o.contactPerson || '—'}<br><small style="color: #999;">${o.phone || ''}</small></td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" style="padding: 4px 8px; font-size: 12px;" onclick="openOrgDetailModal('${o.id}')"><i class="fa-solid fa-eye"></i> View</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function getOrgTypeBadge(type) {
  const colors = { Club: '#4fc3f7', School: '#81c784', College: '#ffb74d', Academy: '#ce93d8', District: '#e57373' };
  const icons = { Club: 'fa-shield', School: 'fa-school', College: 'fa-university', Academy: 'fa-graduation-cap', District: 'fa-map-location-dot' };
  const bg = colors[type] || '#888';
  const icon = icons[type] || 'fa-building';
  return `<span style="display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600; background:${bg}22; color:${bg}; border:1px solid ${bg}55;"><i class="fa-solid ${icon}"></i> ${type}</span>`;
}

function getOrgStatusBadge(status) {
  if (status === 'Approved') return '<span class="badge green">Approved</span>';
  if (status === 'Rejected') return '<span class="badge red">Rejected</span>';
  return '<span class="badge gold">Pending</span>';
}

// ─── Detail / Approval Modal ────────────────────────────────────────────────

function openOrgDetailModal(id) {
  const org = OrgService.getById(id);
  if (!org) return;

  document.getElementById('orgDetailModal').style.display = 'flex';
  document.getElementById('orgDetailContent').innerHTML = buildOrgDetailHTML(org);
  document.getElementById('orgDetailModal').dataset.orgId = id;

  // Show / hide approval buttons
  const approvalSection = document.getElementById('orgApprovalSection');
  const rejReasonSection = document.getElementById('orgRejReasonInput');
  if (org.status === 'Pending') {
    approvalSection.style.display = 'flex';
    rejReasonSection.style.display = 'none';
    document.getElementById('orgRejectReasonText').value = '';
  } else {
    approvalSection.style.display = 'none';
    rejReasonSection.style.display = 'none';
  }
}

function closeOrgDetailModal() {
  document.getElementById('orgDetailModal').style.display = 'none';
}

function buildOrgDetailHTML(org) {
  const typeBadge = getOrgTypeBadge(org.orgType);
  const statusBadge = getOrgStatusBadge(org.status);
  const collegeName = org.orgType === 'College' && org.collegeId ? getCollegeName(org.collegeId) : '';
  const collegeRow = collegeName ? `<tr><td style="padding:8px 12px; color:#aaa;">Linked College</td><td style="padding:8px 12px;">${collegeName}</td></tr>` : '';
  const rejectionRow = org.status === 'Rejected' && org.rejectionReason
    ? `<tr><td style="padding:8px 12px; color:#ff6b6b;">Rejection Reason</td><td style="padding:8px 12px; color:#ff6b6b;"><i class="fa-solid fa-exclamation-triangle"></i> ${org.rejectionReason}</td></tr>`
    : '';

  let squadHtml = '';
  if (org.status === 'Approved' && typeof PlayerService !== 'undefined') {
    const players = PlayerService.getAll().filter(p => p.selectedTeamId === org.id);
    const confirmedPlayers = players.filter(p => p.status === 'Confirmed');
    const pendingPlayers = players.filter(p => p.status === 'Pending');
    
    squadHtml += `<div style="margin-top:25px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.1);">
      <h4 style="margin-bottom:10px;"><i class="fa-solid fa-users"></i> Team Squad <span class="badge gold" style="font-size:11px; margin-left:8px;">${confirmedPlayers.length} Confirmed</span></h4>
    `;
    
    if (players.length === 0) {
      squadHtml += `<p style="color:#888; font-size:13px;">No players have registered for this team yet.</p>`;
    } else {
      squadHtml += `<table style="width:100%; border-collapse:collapse; font-size:13px; margin-top:10px;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.1); color:#aaa;">
          <th style="padding:6px; text-align:left;">Name</th>
          <th style="padding:6px; text-align:left;">Role</th>
          <th style="padding:6px; text-align:left;">Category</th>
          <th style="padding:6px; text-align:left;">Status</th>
        </tr>`;
      
      players.forEach(p => {
        let pStatus = p.status === 'Confirmed' ? '<span style="color:#81c784;"><i class="fa-solid fa-check-circle"></i> Confirmed</span>' : '<span style="color:#ffb74d;"><i class="fa-solid fa-clock"></i> Pending</span>';
        let catLabel = typeof CategoryService !== 'undefined' ? (CategoryService.getAll().find(c => c.id === p.category)?.label || p.category) : p.category;
        
        squadHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
          <td style="padding:8px 6px;"><strong>${p.fullName}</strong></td>
          <td style="padding:8px 6px; color:#ccc;">${p.speciality}</td>
          <td style="padding:8px 6px; color:#ccc;">${catLabel}</td>
          <td style="padding:8px 6px;">${pStatus}</td>
        </tr>`;
      });
      squadHtml += `</table>`;
    }
    squadHtml += `</div>`;
  }

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
      <div>${typeBadge} ${statusBadge}</div>
      <small style="color:#888;">ID: ${org.id} • Registered: ${new Date(org.createdAt).toLocaleDateString()}</small>
    </div>
    <table style="width:100%; border-collapse:collapse;">
      <tr><td style="padding:8px 12px; color:#aaa; width:160px;">Organization Name</td><td style="padding:8px 12px; font-weight:600;">${org.name}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Reg / Affiliation No.</td><td style="padding:8px 12px;">${org.regNumber}</td></tr>
      ${collegeRow}
      <tr><td style="padding:8px 12px; color:#aaa;">District</td><td style="padding:8px 12px;">${org.district || '—'}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Address</td><td style="padding:8px 12px;">${org.address || '—'}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Contact Person</td><td style="padding:8px 12px;">${org.contactPerson || '—'}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Phone</td><td style="padding:8px 12px;">${org.phone || '—'}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Email</td><td style="padding:8px 12px;">${org.email || '—'}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">Logo</td><td style="padding:8px 12px;">${org.logoFileName || '<em style="color:#666;">Not uploaded</em>'}</td></tr>
      <tr><td style="padding:8px 12px; color:#aaa;">Affiliation Proof</td><td style="padding:8px 12px;">${org.affiliationProofFileName || '<em style="color:#666;">Not uploaded</em>'}</td></tr>
      <tr style="background:rgba(255,255,255,0.03);"><td style="padding:8px 12px; color:#aaa;">ID Proof</td><td style="padding:8px 12px;">${org.idProofFileName || '<em style="color:#666;">Not uploaded</em>'}</td></tr>
      ${rejectionRow}
    </table>
    ${squadHtml}
  `;
}

function getCollegeName(collegeId) {
  if (typeof CollegeService === 'undefined') return '';
  const college = CollegeService.getColleges().find(c => c.id === collegeId);
  return college ? `${college.name} (${college.code})` : '';
}

function handleOrgApprove() {
  const id = document.getElementById('orgDetailModal').dataset.orgId;
  if (confirm('Approve this organization registration?')) {
    OrgService.approve(id);
    closeOrgDetailModal();
    renderOrgListing();
    openOrgDetailModal(id); // reopen with updated status
  }
}

function showOrgRejectInput() {
  document.getElementById('orgRejReasonInput').style.display = 'block';
}

function handleOrgReject() {
  const id = document.getElementById('orgDetailModal').dataset.orgId;
  const reason = document.getElementById('orgRejectReasonText').value.trim();
  if (!reason) {
    alert('Please provide a reason for rejection.');
    return;
  }
  OrgService.reject(id, reason);
  closeOrgDetailModal();
  renderOrgListing();
  openOrgDetailModal(id);
}

function handleOrgDelete(id) {
  if (confirm('Are you sure you want to delete this organization record?')) {
    OrgService.delete(id);
    closeOrgDetailModal();
    renderOrgListing();
  }
}

// ─── Bind close on outside click ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ['orgRegistrationModal', 'orgListingModal', 'orgDetailModal'].forEach(modalId => {
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
});
