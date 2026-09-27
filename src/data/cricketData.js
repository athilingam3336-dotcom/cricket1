/**
 * Cricket Federation of Virudhunagar District (CFVD)
 * Official Match Data & Records (Affiliated to TNCA)
 */

export const QUICK_METRICS = [
  { id: '1', label: 'Registered Players', value: '1,200+', icon: 'account-group' },
  { id: '2', label: 'Affiliated Clubs', value: '42+', icon: 'shield-crown' },
  { id: '3', label: 'District Grounds', value: '18+', icon: 'stadium-variant' },
  { id: '4', label: 'Annual Matches', value: '350+', icon: 'cricket' },
];

export const TICKER_ITEMS = [
  '🏆 VPL 2026 Final: Virudhunagar Strikers 164/5 (18.2 ov) vs Sivakasi Super Kings 162/8 — Need 2 runs in 4 balls',
  '📢 TNCA Division 1 League: Day 2 Stumps — Rajapalayam CC 312 & 45/1 vs Aruppukottai Stars 220',
  '⭐ District Trials: Under-19 Virudhunagar Team selection on Oct 5 at District Sports Complex Ground',
  '🥇 Result: Srivilliputhur Warriors beat Sattur XI by 42 runs in Buchi Babu Qualifier',
];

export const MATCHES_DATA = [
  {
    id: 'match-1',
    category: 'live',
    tournament: 'Virudhunagar Premier League • Final',
    format: 'T20',
    formatColor: '#EF4444',
    team1: {
      name: 'Virudhunagar Strikers',
      code: 'VS',
      crestClass: 'striker',
      score: '164/5',
      overs: '18.2 ov',
      isBatting: true,
      color: '#F59E0B',
    },
    team2: {
      name: 'Sivakasi Super Kings',
      code: 'SSK',
      crestClass: 'king',
      score: '162/8',
      overs: '20.0 ov',
      isBatting: false,
      color: '#3B82F6',
    },
    statusNote: 'Virudhunagar Strikers need 2 runs in 4 balls',
    statusType: 'live',
    venue: 'District Sports Complex Ground, Virudhunagar',
  },
  {
    id: 'match-2',
    category: 'live',
    tournament: 'TNCA 1st Division League • Day 2',
    format: '3-DAY',
    formatColor: '#10B981',
    team1: {
      name: 'Rajapalayam Cricket Club',
      code: 'RCC',
      crestClass: 'rcc',
      score: '312 & 45/1',
      overs: '14.0 ov',
      isBatting: true,
      color: '#8B5CF6',
    },
    team2: {
      name: 'Aruppukottai Stars CC',
      code: 'AKS',
      crestClass: 'stars',
      score: '220/10',
      overs: '68.4 ov',
      isBatting: false,
      color: '#EC4899',
    },
    statusNote: 'Rajapalayam CC lead by 137 runs at Stumps Day 2',
    statusType: 'live',
    venue: 'Sivakasi Turf Cricket Ground, Sivakasi',
  },
  {
    id: 'match-3',
    category: 'upcoming',
    tournament: 'TNCA Inter-District Selection Cup',
    format: '50-OVERS',
    formatColor: '#3B82F6',
    team1: {
      name: 'Virudhunagar District Colts',
      code: 'VDC',
      crestClass: 'colts',
      score: 'Upcoming',
      overs: '',
      isBatting: false,
      color: '#F59E0B',
    },
    team2: {
      name: 'Madurai District XI',
      code: 'MDU',
      crestClass: 'mdu',
      score: 'Upcoming',
      overs: '',
      isBatting: false,
      color: '#10B981',
    },
    statusNote: 'Tomorrow at 09:00 AM IST (Toss at 08:30 AM)',
    statusType: 'upcoming',
    venue: 'Andal Temple Ground, Srivilliputhur',
  },
  {
    id: 'match-4',
    category: 'upcoming',
    tournament: 'Andal Trophy Inter-School Cup',
    format: 'T20',
    formatColor: '#EF4444',
    team1: {
      name: 'KVS Higher Secondary School',
      code: 'KVS',
      crestClass: 'kvs',
      score: 'Upcoming',
      overs: '',
      isBatting: false,
      color: '#06B6D4',
    },
    team2: {
      name: 'PACM High School, Rajapalayam',
      code: 'PAC',
      crestClass: 'pac',
      score: 'Upcoming',
      overs: '',
      isBatting: false,
      color: '#F97316',
    },
    statusNote: 'Oct 02, 2026 at 02:00 PM IST',
    statusType: 'upcoming',
    venue: 'District Sports Complex Ground, Virudhunagar',
  },
  {
    id: 'match-5',
    category: 'results',
    tournament: 'Kamarajar Memorial T20 Trophy',
    format: 'T20',
    formatColor: '#EF4444',
    team1: {
      name: 'Srivilliputhur Warriors',
      code: 'SW',
      crestClass: 'spw',
      score: '186/6',
      overs: '20.0 ov',
      isBatting: false,
      isWinner: true,
      color: '#D97706',
    },
    team2: {
      name: 'Sattur Cricket XI',
      code: 'SXI',
      crestClass: 'str',
      score: '144/9',
      overs: '20.0 ov',
      isBatting: false,
      isWinner: false,
      color: '#64748B',
    },
    statusNote: 'Srivilliputhur Warriors won by 42 runs',
    statusType: 'result',
    venue: 'Sattur Town Sports Ground',
  },
  {
    id: 'match-6',
    category: 'results',
    tournament: 'TNCA Buchi Babu Qualifier Leg',
    format: '50-OVERS',
    formatColor: '#3B82F6',
    team1: {
      name: 'Virudhunagar CC',
      code: 'VCC',
      crestClass: 'vcc',
      score: '274/8',
      overs: '50.0 ov',
      isBatting: false,
      isWinner: true,
      color: '#D97706',
    },
    team2: {
      name: 'Thiruthangal Cricket Club',
      code: 'TKC',
      crestClass: 'thk',
      score: '198/10',
      overs: '41.3 ov',
      isBatting: false,
      isWinner: false,
      color: '#64748B',
    },
    statusNote: 'Virudhunagar CC won by 76 runs',
    statusType: 'result',
    venue: 'Sivakasi Turf Cricket Ground',
  },
];

export const SCORECARD_DETAILS = {
  'match-1': {
    title: 'Virudhunagar Strikers vs Sivakasi Super Kings',
    subtitle: 'VPL 2026 Grand Final • District Sports Complex Ground • 20 Overs a side',
    chasingTarget: 163,
    summary: {
      team1: {
        name: 'Virudhunagar Strikers',
        score: '164/5',
        overs: '18.2 / 20.0',
        crr: '8.95',
        req: '2 runs from 4 balls',
        isCurrent: true,
      },
      team2: {
        name: 'Sivakasi Super Kings',
        score: '162/8',
        overs: '20.0',
        runRate: '8.10',
        topScorer: 'M. Anandhan 54 (39)',
      },
      crease: [
        { name: 'R. Saravanan*', r: 58, b: 34, fours: 6, sixes: 2, sr: '170.58' },
        { name: 'K. Ganesan', r: 14, b: 8, fours: 1, sixes: 1, sr: '175.00' },
      ],
      currentBowler: {
        name: 'M. Vignesh', o: '3.2', m: 0, r: 28, w: 2, econ: '8.40'
      }
    },
    batting: [
      { batter: 'P. Muthukumar', dismissal: 'c Karthik b M. Vignesh', r: 24, b: 18, fours: 4, sixes: 0, sr: '133.33' },
      { batter: 'A. Dinesh', dismissal: 'b Praveen Kumar', r: 18, b: 14, fours: 2, sixes: 1, sr: '128.57' },
      { batter: 'R. Saravanan*', dismissal: 'not out', r: 58, b: 34, fours: 6, sixes: 2, sr: '170.58', highlight: true },
      { batter: 'S. Balaji (wk)', dismissal: 'lbw b Aravind', r: 31, b: 22, fours: 3, sixes: 1, sr: '140.91' },
      { batter: 'T. Manikandan (c)', dismissal: 'c & b M. Vignesh', r: 12, b: 9, fours: 1, sixes: 0, sr: '133.33' },
      { batter: 'K. Ganesan', dismissal: 'not out', r: 14, b: 8, fours: 1, sixes: 1, sr: '175.00' },
    ],
    extras: '7 (w 4, nb 1, b 0, lb 2)',
    total: '164/5 (18.2 Ov)',
    bowling: [
      { bowler: 'M. Vignesh', o: '3.2', m: 0, r: 28, w: 2, econ: '8.40' },
      { bowler: 'K. Praveen Kumar', o: '4.0', m: 0, r: 32, w: 1, econ: '8.00' },
      { bowler: 'D. Aravind', o: '4.0', m: 0, r: 38, w: 1, econ: '9.50' },
      { bowler: 'K. Santhosh', o: '4.0', m: 0, r: 35, w: 0, econ: '8.75' },
      { bowler: 'T. Nagarajan', o: '3.0', m: 0, r: 26, w: 0, econ: '8.67' },
    ],
    commentary: [
      { ball: '18.2', type: 'runs', text: 'TWO RUNS! Clipped off the pads towards deep midwicket. Rapid running between wickets as Saravanan dives in! Virudhunagar Strikers need just 2 runs to win!' },
      { ball: '18.1', type: 'four', text: 'FOUR! Beautiful cover drive through extra cover! Saravanan leans forward and creams it past mid-off with absolute perfection.' },
      { ball: '17.6', type: 'single', text: 'Single taken to long on. Keeps the strike. 8 runs from the 18th over.' },
      { ball: '17.5', type: 'six', text: 'SIX! Smoked into the grandstand! Clean strike over wide long-on by Ganesan! What a time to unleash!' },
      { ball: '17.4', type: 'dot', text: 'Good length delivery outside off, pushed towards point. Dot ball.' },
      { ball: '17.3', type: 'wicket', text: 'WICKET! Manikandan mistimes the pull shot, top edge straight back to the bowler Vignesh. Strikers 148/5.' },
    ],
    playingXI: {
      team1: ['P. Muthukumar', 'A. Dinesh', 'R. Saravanan', 'S. Balaji (WK)', 'T. Manikandan (C)', 'K. Ganesan', 'M. Ramesh', 'V. Ashok', 'K. Praveen Kumar', 'S. Balamurugan', 'N. Chandran'],
      team2: ['M. Anandhan', 'C. Rajesh', 'S. Karthik Raja (C & WK)', 'D. Aravind', 'G. Vigneshwaran', 'M. Vignesh', 'K. Santhosh', 'R. Jayakumar', 'P. Marimuthu', 'T. Nagarajan', 'L. Vetrivel'],
    }
  },
  'match-2': {
    title: 'Rajapalayam CC vs Aruppukottai Stars CC',
    subtitle: 'TNCA District 1st Division League • Day 2 Stumps • Sivakasi Turf Ground',
    chasingTarget: null,
    summary: {
      team1: {
        name: 'Rajapalayam CC',
        score: '312 & 45/1',
        overs: '14.0 ov',
        crr: '3.21',
        req: 'Lead by 137 runs',
        isCurrent: true,
      },
      team2: {
        name: 'Aruppukottai Stars CC',
        score: '220/10',
        overs: '68.4 ov',
        runRate: '3.20',
        topScorer: 'K. Ganesan 84 (118)',
      },
      crease: [
        { name: 'S. Karthik Raja*', r: 24, b: 42, fours: 3, sixes: 0, sr: '57.14' },
        { name: 'T. Manikandan', r: 16, b: 30, fours: 2, sixes: 0, sr: '53.33' },
      ],
      currentBowler: {
        name: 'S. Balamurugan', o: '7.0', m: 2, r: 18, w: 1, econ: '2.57'
      }
    },
    batting: [
      { batter: 'M. Ramesh', dismissal: 'b Balamurugan', r: 4, b: 12, fours: 0, sixes: 0, sr: '33.33' },
      { batter: 'S. Karthik Raja*', dismissal: 'not out', r: 24, b: 42, fours: 3, sixes: 0, sr: '57.14', highlight: true },
      { batter: 'T. Manikandan', dismissal: 'not out', r: 16, b: 30, fours: 2, sixes: 0, sr: '53.33' },
    ],
    extras: '1 (w 0, nb 1, b 0, lb 0)',
    total: '45/1 (14.0 Ov) - 2nd Innings',
    bowling: [
      { bowler: 'S. Balamurugan', o: '7.0', m: 2, r: 18, w: 1, econ: '2.57' },
      { bowler: 'R. Jayakumar', o: '7.0', m: 1, r: 27, w: 0, econ: '3.86' },
    ],
    commentary: [
      { ball: '14.0', type: 'dot', text: 'Good defensive stroke by Manikandan. That brings Day 2 to an end. Stumps!' },
      { ball: '13.5', type: 'four', text: 'FOUR! Elegant drive past extra cover for four runs.' },
      { ball: '13.4', type: 'single', text: 'Pushed into the gap for an easy single.' },
    ],
    playingXI: {
      team1: ['S. Karthik Raja (C)', 'M. Ramesh', 'T. Manikandan', 'P. Muthukumar', 'A. Dinesh', 'R. Saravanan', 'S. Balaji (WK)', 'K. Ganesan', 'V. Ashok', 'S. Balamurugan', 'N. Chandran'],
      team2: ['K. Ganesan (C)', 'C. Rajesh', 'M. Anandhan', 'D. Aravind', 'G. Vigneshwaran', 'M. Vignesh', 'K. Santhosh', 'R. Jayakumar', 'P. Marimuthu', 'T. Nagarajan', 'L. Vetrivel'],
    }
  },
  'match-5': {
    title: 'Srivilliputhur Warriors vs Sattur Cricket XI',
    subtitle: 'Kamarajar Memorial T20 Trophy • Match 14 • Sattur Ground • Result',
    chasingTarget: 187,
    summary: {
      team1: {
        name: 'Srivilliputhur Warriors',
        score: '186/6',
        overs: '20.0 ov',
        crr: '9.30',
        req: 'Won by 42 runs',
        isCurrent: false,
      },
      team2: {
        name: 'Sattur Cricket XI',
        score: '144/9',
        overs: '20.0 ov',
        runRate: '7.20',
        topScorer: 'N. Chandran 41 (28)',
      },
      crease: [],
      currentBowler: null,
    },
    batting: [
      { batter: 'P. Muthukumar', dismissal: 'b Chandran', r: 68, b: 42, fours: 7, sixes: 3, sr: '161.90', highlight: true },
      { batter: 'D. Aravind', dismissal: 'c & b Balamurugan', r: 44, b: 26, fours: 4, sixes: 2, sr: '169.23' },
      { batter: 'R. Jayakumar', dismissal: 'not out', r: 28, b: 18, fours: 2, sixes: 1, sr: '155.55' },
    ],
    extras: '12',
    total: '186/6 (20.0 Ov)',
    bowling: [
      { bowler: 'D. Aravind', o: '4.0', m: 0, r: 16, w: 4, econ: '4.00' },
      { bowler: 'P. Marimuthu', o: '4.0', m: 0, r: 24, w: 3, econ: '6.00' },
    ],
    commentary: [
      { ball: '20.0', type: 'wicket', text: 'Clean bowled! Warriors clinch an emphatic 42-run victory with dominant bowling performance.' },
    ],
    playingXI: {
      team1: ['P. Muthukumar', 'D. Aravind', 'R. Jayakumar', 'V. Ashok', 'G. Vigneshwaran', 'S. Balaji', 'M. Ramesh', 'T. Manikandan', 'K. Praveen Kumar', 'S. Balamurugan', 'N. Chandran'],
      team2: ['N. Chandran', 'S. Balamurugan', 'M. Vignesh', 'K. Santhosh', 'P. Marimuthu', 'T. Nagarajan', 'L. Vetrivel', 'C. Rajesh', 'M. Anandhan', 'A. Dinesh', 'R. Saravanan'],
    }
  },
  'match-6': {
    title: 'Virudhunagar CC vs Thiruthangal CC',
    subtitle: 'TNCA Buchi Babu District Leg • 50-Overs One Day Match • Result',
    chasingTarget: 275,
    summary: {
      team1: {
        name: 'Virudhunagar CC',
        score: '274/8',
        overs: '50.0 ov',
        crr: '5.48',
        req: 'Won by 76 runs',
        isCurrent: false,
      },
      team2: {
        name: 'Thiruthangal CC',
        score: '198/10',
        overs: '41.3 ov',
        runRate: '4.77',
        topScorer: 'K. Santhosh 56 (62)',
      },
      crease: [],
      currentBowler: null,
    },
    batting: [
      { batter: 'K. Praveen Kumar', dismissal: 'c Vetrivel b Santhosh', r: 92, b: 104, fours: 9, sixes: 2, sr: '88.46', highlight: true },
      { batter: 'R. Saravanan', dismissal: 'lbw b Nagarajan', r: 54, b: 62, fours: 5, sixes: 1, sr: '87.09' },
    ],
    extras: '18',
    total: '274/8 (50.0 Ov)',
    bowling: [
      { bowler: 'K. Praveen Kumar', o: '8.3', m: 1, r: 34, w: 5, econ: '4.00' },
    ],
    commentary: [
      { ball: '41.3', type: 'wicket', text: 'Caught at slip! 5th wicket for Praveen Kumar! Virudhunagar CC win by 76 runs.' },
    ],
    playingXI: {
      team1: ['K. Praveen Kumar (C)', 'R. Saravanan', 'M. Anandhan', 'S. Balaji (WK)', 'T. Manikandan', 'K. Ganesan', 'M. Ramesh', 'V. Ashok', 'S. Balamurugan', 'N. Chandran', 'D. Aravind'],
      team2: ['K. Santhosh', 'T. Nagarajan', 'L. Vetrivel', 'C. Rajesh', 'M. Vignesh', 'R. Jayakumar', 'P. Marimuthu', 'G. Vigneshwaran', 'P. Muthukumar', 'A. Dinesh', 'S. Karthik Raja'],
    }
  }
};

export const TABLE_DATA_SETS = {
  div1: [
    { pos: 1, badge: 'gold', name: 'Virudhunagar Strikers CC', sub: 'Qualified for Knockouts', p: 7, w: 6, l: 1, d: 0, bonus: 3, nrr: '+1.428', pts: 27, form: ['w','w','w','l','w'], code: 'VS', crestClass: 'striker' },
    { pos: 2, badge: 'silver', name: 'Sivakasi Super Kings', sub: 'Qualified for Knockouts', p: 7, w: 5, l: 2, d: 0, bonus: 2, nrr: '+0.892', pts: 22, form: ['w','l','w','w','w'], code: 'SSK', crestClass: 'king' },
    { pos: 3, badge: 'bronze', name: 'Rajapalayam Cricket Club', sub: 'In Contention', p: 7, w: 4, l: 2, d: 1, bonus: 2, nrr: '+0.510', pts: 19, form: ['w','w','d','l','w'], code: 'RCC', crestClass: 'rcc' },
    { pos: 4, badge: '', name: 'Srivilliputhur Warriors', sub: 'In Contention', p: 7, w: 4, l: 3, d: 0, bonus: 1, nrr: '+0.215', pts: 17, form: ['l','w','w','l','w'], code: 'SW', crestClass: 'spw' },
    { pos: 5, badge: '', name: 'Aruppukottai Stars CC', sub: '', p: 7, w: 3, l: 4, d: 0, bonus: 1, nrr: '-0.118', pts: 13, form: ['l','l','w','w','l'], code: 'AKS', crestClass: 'stars' },
    { pos: 6, badge: '', name: 'Sattur Cricket XI', sub: '', p: 7, w: 2, l: 5, d: 0, bonus: 0, nrr: '-0.640', pts: 8, form: ['l','w','l','l','l'], code: 'SXI', crestClass: 'str' },
    { pos: 7, badge: '', name: 'Thiruthangal CC', sub: '', p: 7, w: 1, l: 5, d: 1, bonus: 0, nrr: '-1.204', pts: 5, form: ['l','d','l','l','w'], code: 'TKC', crestClass: 'thk' }
  ],
  t20: [
    { pos: 1, badge: 'gold', name: 'Virudhunagar Strikers CC', sub: 'Finalist', p: 6, w: 5, l: 1, d: 0, bonus: 2, nrr: '+1.850', pts: 12, form: ['w','w','w','w','l'], code: 'VS', crestClass: 'striker' },
    { pos: 2, badge: 'silver', name: 'Sivakasi Super Kings', sub: 'Finalist', p: 6, w: 5, l: 1, d: 0, bonus: 1, nrr: '+1.420', pts: 11, form: ['w','w','l','w','w'], code: 'SSK', crestClass: 'king' },
    { pos: 3, badge: 'bronze', name: 'Srivilliputhur Warriors', sub: 'Semi-Finalist', p: 6, w: 3, l: 3, d: 0, bonus: 1, nrr: '+0.150', pts: 7, form: ['l','w','l','w','w'], code: 'SW', crestClass: 'spw' },
    { pos: 4, badge: '', name: 'Rajapalayam CC', sub: 'Semi-Finalist', p: 6, w: 3, l: 3, d: 0, bonus: 0, nrr: '-0.080', pts: 6, form: ['w','l','w','l','l'], code: 'RCC', crestClass: 'rcc' },
    { pos: 5, badge: '', name: 'Watrap Pioneer CC', sub: 'Group Stage', p: 6, w: 2, l: 4, d: 0, bonus: 0, nrr: '-0.750', pts: 4, form: ['l','l','w','l','w'], code: 'WPC', crestClass: 'stars' },
    { pos: 6, badge: '', name: 'Sattur Cricket XI', sub: 'Group Stage', p: 6, w: 0, l: 6, d: 0, bonus: 0, nrr: '-2.110', pts: 0, form: ['l','l','l','l','l'], code: 'SXI', crestClass: 'str' }
  ],
  school: [
    { pos: 1, badge: 'gold', name: 'KVS Hr Sec School, Virudhunagar', sub: 'Champions', p: 5, w: 5, l: 0, d: 0, bonus: 3, nrr: '+2.410', pts: 13, form: ['w','w','w','w','w'], code: 'KVS', crestClass: 'kvs' },
    { pos: 2, badge: 'silver', name: 'PACM Hr Sec School, Rajapalayam', sub: 'Runners-up', p: 5, w: 4, l: 1, d: 0, bonus: 2, nrr: '+1.620', pts: 10, form: ['w','w','l','w','w'], code: 'PAC', crestClass: 'pac' },
    { pos: 3, badge: 'bronze', name: 'SHN Girls & Boys School, Sivakasi', sub: '3rd Place', p: 5, w: 3, l: 2, d: 0, bonus: 1, nrr: '+0.340', pts: 7, form: ['w','l','w','w','l'], code: 'SHN', crestClass: 'spw' },
    { pos: 4, badge: '', name: 'Govt Model HSS, Srivilliputhur', sub: '4th Place', p: 5, w: 2, l: 3, d: 0, bonus: 0, nrr: '-0.420', pts: 4, form: ['l','w','l','l','w'], code: 'GMH', crestClass: 'str' },
    { pos: 5, badge: '', name: 'St. Marys HSS, Aruppukottai', sub: '5th Place', p: 5, w: 1, l: 4, d: 0, bonus: 0, nrr: '-1.850', pts: 2, form: ['l','l','w','l','l'], code: 'SMH', crestClass: 'stars' }
  ]
};

export const BATTING_LEADERS = [
  { pos: 1, name: 'R. Saravanan', role: 'Top Order Batter', team: 'Virudhunagar Strikers', inns: 7, avg: '64.50', sr: '148.2', runs: 387 },
  { pos: 2, name: 'S. Karthik Raja', role: 'Wicketkeeper Batter', team: 'Rajapalayam CC', inns: 7, avg: '54.20', sr: '132.8', runs: 325 },
  { pos: 3, name: 'M. Anandhan', role: 'Opening Batter', team: 'Sivakasi Super Kings', inns: 6, avg: '48.33', sr: '126.5', runs: 290 },
  { pos: 4, name: 'P. Muthukumar', role: 'Middle Order', team: 'Srivilliputhur Warriors', inns: 7, avg: '43.80', sr: '139.1', runs: 263 },
  { pos: 5, name: 'K. Ganesan', role: 'All-Rounder', team: 'Aruppukottai Stars', inns: 6, avg: '41.00', sr: '141.5', runs: 246 }
];

export const BOWLING_LEADERS = [
  { pos: 1, name: 'K. Praveen Kumar', role: 'Right-Arm Off Spin', team: 'Virudhunagar CC', overs: '26.4', bbi: '5/18', econ: '5.42', wkts: 19 },
  { pos: 2, name: 'M. Vignesh', role: 'Left-Arm Fast Medium', team: 'Sivakasi Super Kings', overs: '28.0', bbi: '4/21', econ: '6.10', wkts: 16 },
  { pos: 3, name: 'D. Aravind', role: 'Right-Arm Leg Spin', team: 'Srivilliputhur Warriors', overs: '24.2', bbi: '4/16', econ: '5.85', wkts: 15 },
  { pos: 4, name: 'T. Manikandan', role: 'Right-Arm Medium Fast', team: 'Rajapalayam CC', overs: '27.0', bbi: '3/19', econ: '6.33', wkts: 13 },
  { pos: 5, name: 'S. Balamurugan', role: 'Slow Left-Arm Orthodox', team: 'Sattur XI', overs: '22.0', bbi: '3/22', econ: '5.90', wkts: 12 }
];

export const TOURNAMENTS_DATA = [
  {
    id: 't-1',
    badge: 'Premier Division',
    format: 'Multi-Day',
    title: 'Virudhunagar First Division League',
    subtitle: 'The G. Parthasarathy Rolling Trophy',
    desc: 'The flagship red-ball 3-day competition with 12 affiliated first-tier clubs competing for district supremacy and state selection.',
    specs: ['12 Affiliated Clubs', 'Oct 2026 - Jan 2027', '₹2,50,000 Prize Purse'],
    icon: 'shield-star',
  },
  {
    id: 't-2',
    badge: 'White Ball',
    format: 'T20 Trophy',
    title: 'Kamarajar Memorial T20 Trophy',
    subtitle: 'Virudhunagar District Premier T20 Cup',
    desc: 'Fast-paced night and day T20 cricket featuring franchise-mode taluk teams with colored clothing and pink/white cricket balls.',
    specs: ['16 Taluk & Club Teams', 'Feb 2027', 'Live Streamed on YouTube'],
    icon: 'lightning-bolt',
  },
  {
    id: 't-3',
    badge: 'Under-16 / U-19',
    format: 'Junior Talent',
    title: 'Andal Temple Inter-School Cup',
    subtitle: 'Srivilliputhur & District Schools Shield',
    desc: 'The premier grassroot nursery identifying teenage talent for the Tamil Nadu State Under-16 and Under-19 state trials.',
    specs: ['24 District Schools', 'Annual Summer Edition', 'TNCA Academy Scholarships'],
    icon: 'school',
  },
  {
    id: 't-4',
    badge: 'BCCI / TNCA Pathway',
    format: 'Selection',
    title: 'Buchi Babu District Qualifier',
    subtitle: 'State Invitation Tournament Selection',
    desc: 'Competitive matches pitting the best district players against neighboring districts for selection into the composite South Zone squad.',
    specs: ['Elite District XI', 'Sep - Oct 2026', 'TNCA Selectors in Attendance'],
    icon: 'trophy-award',
  }
];

export const GROUNDS_DATA = [
  {
    id: 'g-1',
    name: 'District Sports Complex Stadium',
    location: 'Collectorate Road, Virudhunagar',
    desc: 'Featuring 3 BCCI-standard red-soil turf wickets, modern dressing rooms, electronic scoreboard, and 4 turf practice nets.',
    badge: 'Headquarters',
    imageKey: 'stadium',
    facilities: ['Turf Pitch', 'Floodlights', 'Pavilion', '5,000 Seating'],
  },
  {
    id: 'g-2',
    name: 'Sivakasi Turf Cricket Ground',
    location: 'PSR College Sports Enclave, Sivakasi',
    desc: 'Host to TNCA First Division and Buchi Babu District Qualifiers with natural green outfield and fast-paced pitch.',
    badge: 'Match Venue',
    imageKey: 'batsman',
    facilities: ['Dual Turf Wickets', 'Practice Nets', 'Press Box', 'Floodlit'],
  },
  {
    id: 'g-3',
    name: 'Rajapalayam Cricket Academy Ground',
    location: 'PACM Campus, Rajapalayam',
    desc: 'Center for the district high-performance coaching camp and junior age-group tournaments.',
    badge: 'Academy Centre',
    imageKey: 'champions',
    facilities: ['Indoor AstroTurf Nets', 'Video Analysis', 'Gym & Physio', 'Pavilion'],
  }
];

export const OFFICE_BEARERS = [
  { name: 'Thiru. S. Rajendran', role: 'President', tenure: 'Apex Council Member' },
  { name: 'Thiru. K. Meenakshisundaram', role: 'Vice President', tenure: 'Infrastructure & Grounds' },
  { name: 'Thiru. P. Senthil Kumar', role: 'Honorary Secretary', tenure: 'TNCA District Representative', highlight: true },
  { name: 'Thiru. M. Thangavel', role: 'Joint Secretary', tenure: 'Junior Cricket & Tournaments' },
  { name: 'Thiru. V. Shanmuga Sundaram', role: 'Honorary Treasurer', tenure: 'Finance & Audits' },
];

export const NEWS_ARTICLES = [
  {
    id: 1,
    cat: 'Selection Trials',
    date: 'Oct 05, 2026',
    title: 'Virudhunagar District Under-19 Team Selection Trials Announced',
    excerpt: 'Players born on or after 01-09-2007 with valid digital birth certificates and TNCA player ID are eligible to attend the open selection trials.',
    text: 'The Cricket Federation of Virudhunagar District (CFVD), under the aegis of TNCA, announces that open selection trials to pick the Virudhunagar District Under-19 Team for the Tamil Nadu Inter-District Tournament 2026-27 will take place on Saturday, October 05, 2026 at the District Sports Complex Ground, Virudhunagar starting 07:30 AM.\n\nEligibility:\n1. Players born on or after 01-09-2007.\n2. Must be a bonafide resident or student studying in Virudhunagar District.\n3. Original Digital Birth Certificate and Aadhaar Card are mandatory.\n\nWhite cricket clothing and personal protective cricket gear are required.',
    imageKey: 'batsman',
  },
  {
    id: 2,
    cat: 'Tournament',
    date: 'Sep 24, 2026',
    title: 'Virudhunagar Premier League 2026 Concludes with Thrilling Finale',
    excerpt: 'Virudhunagar Strikers and Sivakasi Super Kings battle in a high-octane championship climax at District Sports Complex.',
    text: 'A record crowd packed into the District Sports Complex Ground to witness the grand finale of the Virudhunagar Premier League 2026 between Virudhunagar Strikers and Sivakasi Super Kings. Sivakasi Super Kings posted 162/8 in their 20 overs backed by a stellar 54 from opener M. Anandhan. In response, Virudhunagar Strikers entered the final over needing 8 runs with R. Saravanan batting masterfully on 58*.',
    imageKey: 'champions',
  },
  {
    id: 3,
    cat: 'Officials Clinic',
    date: 'Sep 18, 2026',
    title: 'TNCA Accredited Umpires & Scorers Certification Clinic in October',
    excerpt: 'A three-day comprehensive seminar covering the latest MCC laws of cricket and digital live scoring systems for aspiring match officials.',
    text: 'In our continuous endeavor to raise the standard of officiating in district leagues, CFVD in coordination with TNCA Umpires Sub-Committee will conduct a three-day certification clinic from October 17-19, 2026. The course will be conducted by BCCI accredited Level-3 Umpires and will include both theoretical examinations and practical on-field match assessments.',
    imageKey: 'stadium',
  }
];

export const GALLERY_ITEMS = [
  { id: '1', title: 'Floodlight Grand Finale', caption: 'District Sports Complex Stadium Night Match', imageKey: 'stadium' },
  { id: '2', title: 'Cover Drive Execution', caption: 'First Division League Match Sivakasi Turf', imageKey: 'batsman' },
  { id: '3', title: 'Trophy Presentation', caption: 'Young Stars Academy Champions 2026', imageKey: 'champions' },
  { id: '4', title: 'Official Federation Crest', caption: 'Cricket Federation of Virudhunagar District Emblem', imageKey: 'logo' },
];

export const AFFILIATED_CLUBS = [
  'Virudhunagar CC',
  'Sivakasi Super Kings',
  'Rajapalayam Town CC',
  'Srivilliputhur Warriors',
  'Aruppukottai Stars CC',
  'Sattur Young Cricketers',
  'Thiruthangal Sports Club',
  'Watrap Pioneer CC',
  'KVS Alumni Cricket XI',
  'Andal Colts Cricket Club',
];

export const TALUKS = [
  'Virudhunagar',
  'Sivakasi',
  'Rajapalayam',
  'Srivilliputhur',
  'Aruppukottai',
  'Sattur',
  'Watrap',
  'Kariapatti',
  'Tiruchuli',
];

export const SPECIALTIES = [
  'Top Order Batter',
  'Middle Order Batter',
  'Wicketkeeper Batter',
  'Fast / Medium Pace Bowler',
  'Spin Bowler (Off/Leg/Orthodox)',
  'All-Rounder',
];

export const REGISTRATION_TYPES = [
  { label: 'Senior Player (District 1st & 2nd Division)', value: 'player_senior' },
  { label: 'Junior Player (Under-19 / Under-16 / U-14)', value: 'player_junior' },
  { label: 'District Academy Coaching Enrollment', value: 'academy_admission' },
  { label: 'New Cricket Club Affiliation', value: 'club_affiliation' },
  { label: 'Umpire / Scorer Accreditation', value: 'umpire_scorer' },
];
