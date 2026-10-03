/**
 * src/services/api.ts
 * Frontend REST API & Socket.IO Client for Cricket Scorer System
 */

import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// Determine backend host
const getBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5000/api`;
  }
  return 'http://10.0.2.2:5000/api'; // Android Emulator alias or fallback
};

const getSocketUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname || 'localhost';
    return `http://${host}:5000`;
  }
  return 'http://10.0.2.2:5000';
};

export const API_URL = getBaseUrl();
export const SOCKET_URL = getSocketUrl();

let token: string | null = null;
let currentUser: any = null;
let currentSocket: Socket | null = null;

export const setAuthToken = (newToken: string | null) => {
  token = newToken;
};

export const getAuthToken = () => token;

export const setCurrentUser = (user: any) => {
  currentUser = user;
};

export const getCurrentUser = () => currentUser;

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as any) }
    });

    let data: any = {};
    try {
      data = await res.json();
    } catch (parseErr) {
      data = {};
    }

    if (!res.ok) {
      const error: any = new Error(data.message || data.error || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      error.notFound = data.notFound || res.status === 404;
      error.scorerStatus = data.scorerStatus;
      throw error;
    }
    return data;
  } catch (err: any) {
    if (err.status) throw err;
    console.error(`API Error on ${endpoint}:`, err.message);
    throw err;
  }
}

export const ScorerApi = {
  // --- DEDICATED SCORER REGISTRATION & STATUS CHECK APIS ---
  checkScorer: async (email: string) => {
    return request(`/scorers/check?email=${encodeURIComponent(email)}`);
  },

  registerScorer: async (payload: {
    full_name: string;
    email: string;
    mobile: string;
    association: string;
  }) => {
    return request('/scorers/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getPendingScorers: async () => {
    return request('/admin/scorers/pending');
  },

  getAdminScorers: async (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return request(`/admin/scorers${query}`);
  },

  approveScorer: async (id: string) => {
    return request(`/admin/scorers/${id}/approve`, {
      method: 'PATCH'
    });
  },

  rejectScorer: async (id: string, reason?: string) => {
    return request(`/admin/scorers/${id}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  },

  // --- DEDICATED SCORER OTP APIS ---
  sendScorerOtp: async (email: string) => {
    return request('/scorer/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  verifyScorerOtp: async (email: string, otp: string) => {
    const res = await request('/scorer/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    if (res.token) {
      setAuthToken(res.token);
      if (res.user) setCurrentUser(res.user);
    }
    return res;
  },

  // --- GENERAL AUTHENTICATION & OTP APIs ---
  requestOtp: async (email: string) => {
    return request('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  verifyOtp: async (email: string, otp: string) => {
    const res = await request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    if (res.token) {
      setAuthToken(res.token);
      if (res.user) setCurrentUser(res.user);
    }
    return res;
  },

  login: async (email: string, otp: string) => {
    return ScorerApi.verifyOtp(email, otp);
  },

  register: async (payload: any) => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      setAuthToken(res.token);
      if (res.user) setCurrentUser(res.user);
    }
    return res;
  },

  registerTeam: async (payload: {
    teamName: string;
    coachName: string;
    coachEmail: string;
    taluk?: string;
    players: Array<{ name: string; email: string }>;
  }) => {
    return request('/auth/register-team', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getProfile: async () => {
    return request('/auth/me');
  },

  // --- DASHBOARD & MATCH MANAGEMENT ---
  getDashboard: async () => {
    return request('/scorer/dashboard');
  },

  getMatches: async (filter?: string) => {
    const query = filter ? `?filter=${filter}` : '';
    return request(`/scorer/matches${query}`);
  },

  getMatchSetup: async (matchId: string) => {
    return request(`/scorer/matches/${matchId}/setup`);
  },

  startMatch: async (matchId: string, setup: any) => {
    return request(`/scorer/matches/${matchId}/start`, {
      method: 'POST',
      body: JSON.stringify(setup)
    });
  },

  // --- LIVE SCORING ENGINE ---
  getLiveState: async (matchId: string) => {
    return request(`/scorer/matches/${matchId}/live`);
  },

  recordDelivery: async (matchId: string, delivery: any) => {
    return request(`/scorer/matches/${matchId}/deliveries`, {
      method: 'POST',
      body: JSON.stringify(delivery)
    });
  },

  undoDelivery: async (matchId: string) => {
    return request(`/scorer/matches/${matchId}/undo`, {
      method: 'POST'
    });
  },

  endOver: async (matchId: string, nextBowlerId?: string) => {
    return request(`/scorer/matches/${matchId}/end-over`, {
      method: 'POST',
      body: JSON.stringify({ nextBowlerId })
    });
  },

  endInnings: async (matchId: string) => {
    return request(`/scorer/matches/${matchId}/end-innings`, {
      method: 'POST'
    });
  },

  editDelivery: async (matchId: string, deliveryId: string, delivery: any) => {
    return request(`/scorer/matches/${matchId}/deliveries/${deliveryId}`, {
      method: 'PATCH',
      body: JSON.stringify(delivery)
    });
  },

  endMatch: async (matchId: string, payload?: any) => {
    return request(`/scorer/matches/${matchId}/end`, {
      method: 'POST',
      body: JSON.stringify(payload || {})
    });
  },

  // --- SCORECARD ---
  getScorecard: async (matchId: string) => {
    return request(`/matches/${matchId}/scorecard`);
  },

  // --- REAL-TIME SOCKET.IO CONNECTION ---
  connectSocket: (matchId: string, onUpdate: (data: any) => void) => {
    if (currentSocket) {
      currentSocket.disconnect();
    }

    try {
      currentSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling']
      });

      currentSocket.on('connect', () => {
        currentSocket?.emit('join:match', matchId);
      });

      currentSocket.on('score:update', (payload) => {
        if (!payload.matchId || payload.matchId === matchId) {
          onUpdate(payload);
        }
      });

      return currentSocket;
    } catch (e) {
      console.warn('Socket.IO connection could not be established; falling back to REST.');
      return null;
    }
  },

  disconnectSocket: () => {
    if (currentSocket) {
      currentSocket.disconnect();
      currentSocket = null;
    }
  }
};


export const TeamApi = {
  registerTeam: async (payload: {
    teamName: string;
    coachName: string;
    coachEmail: string;
    players: Array<{ name: string; email: string; role: string }>;
  }) => {
    return request('/teams/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  loginTeam: async (identifier: string, passkey: string) => {
    const res = await request('/teams/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, passkey })
    });
    if (res.token) {
      setAuthToken(res.token);
      if (res.team) setCurrentUser(res.team);
    }
    return res;
  },

  getMe: async () => {
    return request('/teams/me');
  },

  getMePlayers: async () => {
    return request('/teams/me/players');
  },

  logout: async () => {
    const res = await request('/teams/logout', { method: 'POST' });
    setAuthToken(null);
    setCurrentUser(null);
    return res;
  }
};
