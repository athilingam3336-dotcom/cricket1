// adminService.js

// Initial Sample Data (NO State Association / National Board references)
const INITIAL_COLLEGES = [
  { id: '1', name: 'Engineering College A', code: 'ECA101', district: 'Virudhunagar', state: 'Tamil Nadu', address: '123 Edu Street', contactPerson: 'John Doe', phone: '9876543210', email: 'john@eca.edu', status: 'Active' },
  { id: '2', name: 'Arts College B', code: 'ACB102', district: 'Sivakasi', state: 'Tamil Nadu', address: '456 Arts Road', contactPerson: 'Jane Smith', phone: '9876543211', email: 'jane@acb.edu', status: 'Inactive' }
];

// Initialize Mock Data
if (!localStorage.getItem('cricket_colleges')) {
  localStorage.setItem('cricket_colleges', JSON.stringify(INITIAL_COLLEGES));
}

// Service Layer
const CollegeService = {
  getColleges: () => {
    return JSON.parse(localStorage.getItem('cricket_colleges') || '[]');
  },
  saveColleges: (data) => {
    localStorage.setItem('cricket_colleges', JSON.stringify(data));
  },
  addCollege: (college) => {
    const colleges = CollegeService.getColleges();
    if (colleges.find(c => c.code === college.code)) {
      throw new Error('College Code must be unique.');
    }
    college.id = Date.now().toString();
    colleges.push(college);
    CollegeService.saveColleges(colleges);
  },
  updateCollege: (id, updatedCollege) => {
    const colleges = CollegeService.getColleges();
    const index = colleges.findIndex(c => c.id === id);
    if (index !== -1) {
      // Check for code uniqueness if code changed
      if (updatedCollege.code !== colleges[index].code && colleges.find(c => c.code === updatedCollege.code)) {
        throw new Error('College Code must be unique.');
      }
      colleges[index] = { ...colleges[index], ...updatedCollege };
      CollegeService.saveColleges(colleges);
    }
  },
  deleteCollege: (id) => {
    let colleges = CollegeService.getColleges();
    colleges = colleges.filter(c => c.id !== id);
    CollegeService.saveColleges(colleges);
  }
};

// UI Logic for Manage College
let currentEditCollegeId = null;

function openManageCollegeModal() {
  document.getElementById('manageCollegeModal').style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  showCollegeList();
}

function closeManageCollegeModal() {
  document.getElementById('manageCollegeModal').style.display = 'none';
  document.body.style.overflow = '';
}

function showCollegeList() {
  document.getElementById('collegeListSection').style.display = 'block';
  document.getElementById('collegeFormSection').style.display = 'none';
  renderColleges();
}

function showCollegeForm(editId = null) {
  document.getElementById('collegeListSection').style.display = 'none';
  document.getElementById('collegeFormSection').style.display = 'block';
  document.getElementById('collegeFormError').style.display = 'none';
  
  const form = document.getElementById('collegeForm');
  form.reset();
  currentEditCollegeId = editId;

  if (editId) {
    document.getElementById('collegeFormTitle').innerText = 'Edit College';
    const colleges = CollegeService.getColleges();
    const college = colleges.find(c => c.id === editId);
    if (college) {
      document.getElementById('col_name').value = college.name;
      document.getElementById('col_code').value = college.code;
      document.getElementById('col_district').value = college.district;
      document.getElementById('col_state').value = college.state;
      document.getElementById('col_address').value = college.address;
      document.getElementById('col_contact').value = college.contactPerson;
      document.getElementById('col_phone').value = college.phone;
      document.getElementById('col_email').value = college.email;
      document.getElementById('col_status').value = college.status;
    }
  } else {
    document.getElementById('collegeFormTitle').innerText = 'Add New College';
  }
}

function renderColleges(searchTerm = '') {
  let colleges = CollegeService.getColleges();
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    colleges = colleges.filter(c => c.name.toLowerCase().includes(term) || c.code.toLowerCase().includes(term));
  }
  
  const tbody = document.getElementById('collegeTableBody');
  tbody.innerHTML = '';
  
  if (colleges.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 20px;">No colleges found.</td></tr>';
    return;
  }
  
  colleges.forEach(c => {
    const statusBadge = c.status === 'Active' ? '<span class="badge green">Active</span>' : '<span class="badge red">Inactive</span>';
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${c.code}</td>
      <td>${c.district}</td>
      <td>${statusBadge}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" style="padding: 4px 8px; font-size: 12px; margin-right: 5px;" onclick="showCollegeForm('${c.id}')"><i class="fa-solid fa-edit"></i> Edit</button>
        <button class="btn btn-sm btn-outline-gold" style="padding: 4px 8px; font-size: 12px;" onclick="handleDeleteCollege('${c.id}')"><i class="fa-solid fa-trash"></i> Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function handleCollegeSearch(event) {
  renderColleges(event.target.value);
}

function handleCollegeSubmit(event) {
  event.preventDefault();
  
  const name = document.getElementById('col_name').value.trim();
  const code = document.getElementById('col_code').value.trim();
  const district = document.getElementById('col_district').value.trim();
  const state = document.getElementById('col_state').value.trim();
  const address = document.getElementById('col_address').value.trim();
  const contactPerson = document.getElementById('col_contact').value.trim();
  const phone = document.getElementById('col_phone').value.trim();
  const email = document.getElementById('col_email').value.trim();
  const status = document.getElementById('col_status').value;
  
  const errorDiv = document.getElementById('collegeFormError');
  
  // Validation
  if (!name || !code) {
    errorDiv.innerText = 'Name and Code are required.';
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
  
  const collegeData = { name, code, district, state, address, contactPerson, phone, email, status };
  
  try {
    if (currentEditCollegeId) {
      CollegeService.updateCollege(currentEditCollegeId, collegeData);
    } else {
      CollegeService.addCollege(collegeData);
    }
    showCollegeList();
  } catch (error) {
    errorDiv.innerText = error.message;
    errorDiv.style.display = 'block';
  }
}

function handleDeleteCollege(id) {
  if (confirm('Are you sure you want to delete this college?')) {
    CollegeService.deleteCollege(id);
    renderColleges();
  }
}

// Bind modal close to clicking outside
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('manageCollegeModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeManageCollegeModal();
      }
    });
  }
});
