/**
 * Cricket Federation of Virudhunagar District (CFVD)
 * Official Portal Client Script (Affiliated to TNCA)
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initMetricCounters();
  initTickerPause();
  initFloodlights();
  initScrollAnimations();
});

/* --------------------------------------------------------------------------
   1. THEME TOGGLE (Dark / Light)
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  if (!toggleBtn) return;

  const currentTheme = localStorage.getItem('cfvd_theme') || 'dark';
  if (currentTheme === 'light') {
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
    toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
  }

  toggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('theme-light')) {
      document.body.classList.remove('theme-light');
      document.body.classList.add('theme-dark');
      toggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      localStorage.setItem('cfvd_theme', 'dark');
    } else {
      document.body.classList.remove('theme-dark');
      document.body.classList.add('theme-light');
      toggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
      localStorage.setItem('cfvd_theme', 'light');
    }
  });
}

/* --------------------------------------------------------------------------
   2. MOBILE DRAWER NAVIGATION
   -------------------------------------------------------------------------- */
function initMobileMenu() {
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mainNav = document.getElementById('mainNav');
  if (!mobileBtn || !mainNav) return;

  mobileBtn.addEventListener('click', () => {
    mainNav.classList.toggle('mobile-active');
  });

  // Mobile dropdown handling (matches 1150px breakpoint)
  const dropdownToggles = document.querySelectorAll('.nav-item.dropdown > .dropdown-toggle');
  dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      if (window.innerWidth <= 1150) {
        e.preventDefault();
        const parent = toggle.closest('.nav-item.dropdown');
        parent.classList.toggle('open');
      }
    });
  });

  // Close nav on anchor click on mobile
  const navLinks = document.querySelectorAll('.nav-link:not(.dropdown-toggle)');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1150) {
        mainNav.classList.remove('mobile-active');
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. HERO COUNTER ANIMATION
   -------------------------------------------------------------------------- */
function initMetricCounters() {
  const metricElements = document.querySelectorAll('.metric-val');
  
  metricElements.forEach(el => {
    const rawVal = el.getAttribute('data-target');
    if (!rawVal) return;
    const target = parseInt(rawVal, 10);
    const duration = 1800; // ms
    const startTime = performance.now();

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const easeVal = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeVal * target);

      if (target >= 1000) {
        el.textContent = current.toLocaleString() + '+';
      } else {
        el.textContent = current;
      }

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        if (target >= 1000) {
          el.textContent = target.toLocaleString() + '+';
        } else {
          el.textContent = target;
        }
      }
    }
    requestAnimationFrame(updateCounter);
  });
}

/* --------------------------------------------------------------------------
   4. TICKER INTERACTION
   -------------------------------------------------------------------------- */
function initTickerPause() {
  const ticker = document.getElementById('tickerContent');
  if (!ticker) return;
  ticker.addEventListener('mouseenter', () => {
    ticker.style.animationPlayState = 'paused';
  });
  ticker.addEventListener('mouseleave', () => {
    ticker.style.animationPlayState = 'running';
  });
}

/* --------------------------------------------------------------------------
   5. MATCH CENTRE FILTER (All, Live, Upcoming, Results)
   -------------------------------------------------------------------------- */
function filterMatches(category) {
  const buttons = document.querySelectorAll('.filter-tab');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-filter') === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const cards = document.querySelectorAll('.match-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
      card.style.animation = 'fadeInCard 0.4s ease forwards';
    } else {
      card.style.display = 'none';
    }
  });
}

// Add animation keyframe dynamically
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes fadeInCard {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

/* --------------------------------------------------------------------------
   6. POINTS TABLE SWITCHER (Div 1, T20, School)
   -------------------------------------------------------------------------- */
const tableDataSets = {
  div1: [
    { pos: 1, badge: 'gold', name: 'Virudhunagar Strikers CC', sub: 'Qualified for Knockouts', p: 7, w: 6, l: 1, d: 0, bonus: 3, nrr: '+1.428', pts: 27, form: ['w','w','w','l','w'], crest: 'striker-crest', code: 'VS' },
    { pos: 2, badge: 'silver', name: 'Sivakasi Super Kings', sub: 'Qualified for Knockouts', p: 7, w: 5, l: 2, d: 0, bonus: 2, nrr: '+0.892', pts: 22, form: ['w','l','w','w','w'], crest: 'king-crest', code: 'SSK' },
    { pos: 3, badge: 'bronze', name: 'Rajapalayam Cricket Club', sub: 'In Contention', p: 7, w: 4, l: 2, d: 1, bonus: 2, nrr: '+0.510', pts: 19, form: ['w','w','d','l','w'], crest: 'rcc-crest', code: 'RCC' },
    { pos: 4, badge: '', name: 'Srivilliputhur Warriors', sub: 'In Contention', p: 7, w: 4, l: 3, d: 0, bonus: 1, nrr: '+0.215', pts: 17, form: ['l','w','w','l','w'], crest: 'spw-crest', code: 'SW' },
    { pos: 5, badge: '', name: 'Aruppukottai Stars CC', sub: '', p: 7, w: 3, l: 4, d: 0, bonus: 1, nrr: '-0.118', pts: 13, form: ['l','l','w','w','l'], crest: 'stars-crest', code: 'AKS' },
    { pos: 6, badge: '', name: 'Sattur Cricket XI', sub: '', p: 7, w: 2, l: 5, d: 0, bonus: 0, nrr: '-0.640', pts: 8, form: ['l','w','l','l','l'], crest: 'str-crest', code: 'SXI' },
    { pos: 7, badge: '', name: 'Thiruthangal CC', sub: '', p: 7, w: 1, l: 5, d: 1, bonus: 0, nrr: '-1.204', pts: 5, form: ['l','d','l','l','w'], crest: 'thk-crest', code: 'TKC' }
  ],
  t20: [
    { pos: 1, badge: 'gold', name: 'Virudhunagar Strikers CC', sub: 'Finalist', p: 6, w: 5, l: 1, d: 0, bonus: 2, nrr: '+1.850', pts: 12, form: ['w','w','w','w','l'], crest: 'striker-crest', code: 'VS' },
    { pos: 2, badge: 'silver', name: 'Sivakasi Super Kings', sub: 'Finalist', p: 6, w: 5, l: 1, d: 0, bonus: 1, nrr: '+1.420', pts: 11, form: ['w','w','l','w','w'], crest: 'king-crest', code: 'SSK' },
    { pos: 3, badge: 'bronze', name: 'Srivilliputhur Warriors', sub: 'Semi-Finalist', p: 6, w: 3, l: 3, d: 0, bonus: 1, nrr: '+0.150', pts: 7, form: ['l','w','l','w','w'], crest: 'spw-crest', code: 'SW' },
    { pos: 4, badge: '', name: 'Rajapalayam CC', sub: 'Semi-Finalist', p: 6, w: 3, l: 3, d: 0, bonus: 0, nrr: '-0.080', pts: 6, form: ['w','l','w','l','l'], crest: 'rcc-crest', code: 'RCC' },
    { pos: 5, badge: '', name: 'Watrap Pioneer CC', sub: 'Group Stage', p: 6, w: 2, l: 4, d: 0, bonus: 0, nrr: '-0.750', pts: 4, form: ['l','l','w','l','w'], crest: 'stars-crest', code: 'WPC' },
    { pos: 6, badge: '', name: 'Sattur Cricket XI', sub: 'Group Stage', p: 6, w: 0, l: 6, d: 0, bonus: 0, nrr: '-2.110', pts: 0, form: ['l','l','l','l','l'], crest: 'str-crest', code: 'SXI' }
  ],
  school: [
    { pos: 1, badge: 'gold', name: 'KVS Hr Sec School, Virudhunagar', sub: 'Champions', p: 5, w: 5, l: 0, d: 0, bonus: 3, nrr: '+2.410', pts: 13, form: ['w','w','w','w','w'], crest: 'kvs-crest', code: 'KVS' },
    { pos: 2, badge: 'silver', name: 'PACM Hr Sec School, Rajapalayam', sub: 'Runners-up', p: 5, w: 4, l: 1, d: 0, bonus: 2, nrr: '+1.620', pts: 10, form: ['w','w','l','w','w'], crest: 'pac-crest', code: 'PAC' },
    { pos: 3, badge: 'bronze', name: 'SHN Girls & Boys School, Sivakasi', sub: '3rd Place', p: 5, w: 3, l: 2, d: 0, bonus: 1, nrr: '+0.340', pts: 7, form: ['w','l','w','w','l'], crest: 'spw-crest', code: 'SHN' },
    { pos: 4, badge: '', name: 'Govt Model HSS, Srivilliputhur', sub: '4th Place', p: 5, w: 2, l: 3, d: 0, bonus: 0, nrr: '-0.420', pts: 4, form: ['l','w','l','l','w'], crest: 'str-crest', code: 'GMH' },
    { pos: 5, badge: '', name: 'St. Marys HSS, Aruppukottai', sub: '5th Place', p: 5, w: 1, l: 4, d: 0, bonus: 0, nrr: '-1.850', pts: 2, form: ['l','l','w','l','l'], crest: 'stars-crest', code: 'SMH' }
  ]
};

function switchTable(tableKey) {
  const buttons = document.querySelectorAll('.t-switch-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(tableKey)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const tbody = document.getElementById('pointsTableBody');
  if (!tbody || !tableDataSets[tableKey]) return;

  const data = tableDataSets[tableKey];
  tbody.innerHTML = '';

  data.forEach(item => {
    const tr = document.createElement('tr');
    if (item.pos <= 4) tr.classList.add('qualified-row');

    let rankHtml = item.pos;
    if (item.badge) {
      rankHtml = `<span class="badge-rank ${item.badge}">${item.pos}</span>`;
    }

    const formHtml = item.form.map(f => `<span class="form-pill ${f}">${f.toUpperCase()}</span>`).join('');

    tr.innerHTML = `
      <td class="text-center rank-num">${rankHtml}</td>
      <td>
        <div class="team-cell">
          <div class="team-mini-crest ${item.crest}">${item.code}</div>
          <div>
            <strong>${item.name}</strong>
            ${item.sub ? `<span class="table-sub">${item.sub}</span>` : ''}
          </div>
        </div>
      </td>
      <td class="text-center">${item.p}</td>
      <td class="text-center text-bold">${item.w}</td>
      <td class="text-center">${item.l}</td>
      <td class="text-center">${item.d}</td>
      <td class="text-center">${item.bonus}</td>
      <td class="text-center">${item.nrr}</td>
      <td class="text-center pts-col">${item.pts}</td>
      <td class="text-center">${formHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

/* --------------------------------------------------------------------------
   7. SCORECARD MODAL & TABS
   -------------------------------------------------------------------------- */
const matchDetailsData = {
  'match-1': {
    title: 'Virudhunagar Strikers vs Sivakasi Super Kings',
    subtitle: 'VPL 2026 Grand Final • District Sports Complex Ground • 20 Overs a side'
  },
  'match-2': {
    title: 'Rajapalayam CC vs Aruppukottai Stars CC',
    subtitle: 'TNCA District 1st Division League • Day 2 Stumps • Sivakasi Turf Ground'
  },
  'match-3': {
    title: 'Srivilliputhur Warriors vs Sattur Cricket XI',
    subtitle: 'Kamarajar Memorial T20 Trophy • Match 14 • Sattur Ground • Result'
  },
  'match-4': {
    title: 'Virudhunagar CC vs Thiruthangal CC',
    subtitle: 'TNCA Buchi Babu District Leg • 50-Overs One Day Match • Result'
  }
};

function openScorecardModal(matchId) {
  const modal = document.getElementById('scorecardModal');
  const titleEl = document.getElementById('modalMatchTitle');
  const subtitleEl = modal.querySelector('.modal-subtitle');

  if (matchDetailsData[matchId]) {
    titleEl.textContent = matchDetailsData[matchId].title;
    subtitleEl.textContent = matchDetailsData[matchId].subtitle;
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function switchModalTab(tabName) {
  const buttons = document.querySelectorAll('.modal-tab-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick').includes(tabName)) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  const panes = document.querySelectorAll('.m-tab-pane');
  panes.forEach(pane => {
    if (pane.id === `pane-${tabName}`) {
      pane.classList.add('active');
    } else {
      pane.classList.remove('active');
    }
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      modal.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
});

/* --------------------------------------------------------------------------
   8. REGISTRATION MODAL
   -------------------------------------------------------------------------- */
function openRegistrationModal(prefCategory) {
  const modal = document.getElementById('registrationModal');
  if (prefCategory === 'academy') {
    const select = document.getElementById('reg_type');
    if (select) select.value = 'academy_admission';
  }
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function handleRegistrationSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('reg_fullname').value;
  const category = document.getElementById('reg_type').options[document.getElementById('reg_type').selectedIndex].text;
  const token = 'CFVD-' + Math.floor(100000 + Math.random() * 900000);

  alert(`✓ Registration Application Submitted Successfully!\n\nCandidate: ${name}\nCategory: ${category}\nApplication Reference ID: ${token}\n\nPlease save this Reference ID for the selection trials document verification at the District Sports Complex office.`);
  closeModal('registrationModal');
  e.target.reset();
}

/* --------------------------------------------------------------------------
   9. CONTACT FORM
   -------------------------------------------------------------------------- */
function handleContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('c_name').value;
  const subject = document.getElementById('c_subject').options[document.getElementById('c_subject').selectedIndex].text;

  alert(`✓ Thank you ${name}! Your official communication regarding "${subject}" has been logged with the CFVD Secretariat. You will receive a response within 2 business days.`);
  e.target.reset();
}

/* --------------------------------------------------------------------------
   10. LIGHTBOX PREVIEW
   -------------------------------------------------------------------------- */
function previewImage(src, caption) {
  const modal = document.getElementById('imageModal');
  const img = document.getElementById('lightboxImg');
  const cap = document.getElementById('lightboxCaption');

  img.src = src;
  cap.textContent = caption || '';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

/* --------------------------------------------------------------------------
   11. NEWS MODAL PREVIEW
   -------------------------------------------------------------------------- */
const newsArticles = {
  1: {
    title: 'Virudhunagar District Under-19 Team Selection Trials Announced',
    text: 'The Cricket Federation of Virudhunagar District (CFVD), under the aegis of TNCA, announces that open selection trials to pick the Virudhunagar District Under-19 Team for the Tamil Nadu Inter-District Tournament 2026-27 will take place on Saturday, October 05, 2026 at the District Sports Complex Ground, Virudhunagar starting 07:30 AM.\n\nEligibility:\n1. Players born on or after 01-09-2007.\n2. Must be a bonafide resident or student studying in Virudhunagar District.\n3. Original Digital Birth Certificate and Aadhaar Card are mandatory.\n\nWhite cricket clothing and personal protective cricket gear are required.'
  },
  2: {
    title: 'Virudhunagar Premier League 2026 Final Climax',
    text: 'A record crowd packed into the District Sports Complex Ground to witness the grand finale of the Virudhunagar Premier League 2026 between Virudhunagar Strikers and Sivakasi Super Kings. Sivakasi Super Kings posted 162/8 in their 20 overs backed by a stellar 54 from opener M. Anandhan. In response, Virudhunagar Strikers entered the final over needing 8 runs with R. Saravanan batting masterfully on 58*.'
  },
  3: {
    title: 'TNCA Accredited Umpires & Scorers Certification Clinic in October',
    text: 'In our continuous endeavor to raise the standard of officiating in district leagues, CFVD in coordination with TNCA Umpires Sub-Committee will conduct a three-day certification clinic from October 17-19, 2026. The course will be conducted by BCCI accredited Level-3 Umpires and will include both theoretical examinations and practical on-field match assessments.'
  }
};

function openNewsModal(newsId) {
  if (newsArticles[newsId]) {
    alert(`📰 ${newsArticles[newsId].title}\n\n${newsArticles[newsId].text}`);
  }
}

/* --------------------------------------------------------------------------
   12. STADIUM FLOODLIGHTS CONTROLLER
   -------------------------------------------------------------------------- */
function initFloodlights() {
  const toggleBtn = document.getElementById('floodlightToggleBtn');
  if (!toggleBtn) return;

  // Modes: 'on' (Night match floodlights), 'warm' (Golden glow), 'off'
  let currentMode = localStorage.getItem('cfvd_floodlights') || 'on';
  applyFloodlightMode(currentMode);

  toggleBtn.addEventListener('click', () => {
    if (currentMode === 'on') {
      currentMode = 'warm';
    } else if (currentMode === 'warm') {
      currentMode = 'off';
    } else {
      currentMode = 'on';
    }
    applyFloodlightMode(currentMode);
    localStorage.setItem('cfvd_floodlights', currentMode);
  });

  function applyFloodlightMode(mode) {
    document.body.classList.remove('floodlights-off', 'floodlights-warm');
    toggleBtn.classList.remove('active', 'warm');

    if (mode === 'on') {
      toggleBtn.classList.add('active');
      toggleBtn.innerHTML = '<i class="fa-solid fa-lightbulb"></i> <span>Lights</span>';
      toggleBtn.title = 'Stadium Floodlights: Match Night (Click for Golden Glow)';
    } else if (mode === 'warm') {
      document.body.classList.add('floodlights-warm');
      toggleBtn.classList.add('active', 'warm');
      toggleBtn.innerHTML = '<i class="fa-solid fa-bolt"></i> <span>Warm</span>';
      toggleBtn.title = 'Stadium Floodlights: Golden Sunset (Click to Turn OFF)';
    } else {
      document.body.classList.add('floodlights-off');
      toggleBtn.innerHTML = '<i class="fa-regular fa-lightbulb"></i> <span>Off</span>';
      toggleBtn.title = 'Stadium Floodlights: OFF (Click to Turn ON)';
    }
  }
}

/* --------------------------------------------------------------------------
   13. SCROLL REVEAL ANIMATIONS (SAFE ENHANCEMENT - ALL CONTENT STAYS VISIBLE)
   -------------------------------------------------------------------------- */
function initScrollAnimations() {
  const cards = document.querySelectorAll(
    '.match-card, .trophy-card, .stat-card, .bearer-card, .ground-card, .news-card, .gallery-item, .contact-card, .points-table-container, .academy-banner'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed', 'card-reveal-ready');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.05,
      rootMargin: '0px 0px 60px 0px'
    });

    cards.forEach(el => observer.observe(el));
  } else {
    cards.forEach(el => el.classList.add('is-revealed'));
  }

  // Header elevation on scroll
  const header = document.getElementById('mainHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }
}
