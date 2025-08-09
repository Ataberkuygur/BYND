import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Backend running on port 4011 to avoid Expo dev server conflict
const DEFAULT_API_BASE = Platform.OS === 'ios'
  ? 'http://localhost:4011'
  : Platform.OS === 'web'
    ? 'http://localhost:4011'
    : 'http://10.0.2.2:4011';
// Allow override, else start with default; we may swap ports automatically if connection refused.
// eslint-disable-next-line no-undef
let API_BASE = (globalThis && globalThis.__BYND_API__) || DEFAULT_API_BASE;
export function getCurrentBase() { return API_BASE; }
export function setApiBase(next) { API_BASE = next; api.defaults.baseURL = next; }
// Backwards compatibility named export (read-only snapshot)
export const API_BASE_SNAPSHOT = () => API_BASE;

let accessToken = null;
let refreshToken = null;
let expiresAt = null; // ISO or ms
let refreshingPromise = null;

export async function loadTokens() {
  const raw = await AsyncStorage.getItem('authTokens');
  if (raw) {
    try { const parsed = JSON.parse(raw); accessToken = parsed.accessToken; refreshToken = parsed.refreshToken; expiresAt = parsed.expiresAt; } catch {/* ignore */}
  }
}
export async function saveTokens(data) {
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  expiresAt = data.expiresAt;
  await AsyncStorage.setItem('authTokens', JSON.stringify({ accessToken, refreshToken, expiresAt }));
}
export async function clearTokens() {
  accessToken = refreshToken = expiresAt = null;
  await AsyncStorage.removeItem('authTokens');
}

function isExpiringSoon() {
  if (!expiresAt) return true;
  const t = new Date(expiresAt).getTime();
  return Date.now() > t - 30_000; // 30s early refresh window
}

async function refreshIfNeeded() {
  if (!refreshToken) return;
  if (!isExpiringSoon()) return;
  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      try {
        const res = await axios.post(API_BASE + '/auth/refresh', { refreshToken });
        await saveTokens(res.data);
      } catch (e) {
        await clearTokens();
        throw e;
      } finally { refreshingPromise = null; }
    })();
  }
  return refreshingPromise;
}

export const api = axios.create({ baseURL: API_BASE, timeout: 15000 });

api.interceptors.request.use(async (config) => {
  if (!accessToken) await loadTokens();
  if (refreshToken) await refreshIfNeeded();
  if (accessToken) config.headers = { ...(config.headers||{}), Authorization: 'Bearer ' + accessToken };
  return config;
});

let last401 = 0;
api.interceptors.response.use(r => r, async (error) => {
  const status = error.response?.status;
  if (status === 401 && refreshToken && Date.now() - last401 > 500) {
    last401 = Date.now();
    try {
      await refreshIfNeeded();
      error.config._retryAuthOnce = true;
      return api.request(error.config);
    } catch (e) {
      await clearTokens();
    }
  }
  throw error;
});

export async function authLogin(email, password, mode='login') {
  const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
  const fullUrl = API_BASE + endpoint;
  console.log('authLogin attempting:', fullUrl);
  const res = await axios.post(fullUrl, { email, password });
  console.log('authLogin raw response data:', res.data);
  if (!res.data || !res.data.accessToken) {
    console.warn('authLogin: accessToken missing in response keys=', Object.keys(res.data||{}));
    // Fallback: some dev servers might already return { token: ... }
    if (res.data && res.data.token && !res.data.accessToken) {
      res.data.accessToken = res.data.token; // normalize
    }
  }
  await saveTokens(res.data);
  return res.data;
}

export function getAccessToken() { return accessToken; }

// Task Management API
export const taskAPI = {
  // Get all tasks
  getTasks: () => api.get('/tasks'),
  
  // Create a new task
  createTask: (taskData) => api.post('/tasks', taskData),
  
  // Update a task
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  
  // Delete a task
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  
  // Mark task as complete
  completeTask: (id) => api.patch(`/tasks/${id}/complete`)
};

// Calendar API
export const calendarAPI = {
  // Get all events
  getEvents: () => api.get('/calendar/events'),
  
  // Schedule a new event
  scheduleEvent: (eventData) => api.post('/calendar/schedule', eventData),
  
  // Delete an event
  deleteEvent: (id) => api.delete(`/calendar/events/${id}`)
};

// AI API
export const aiAPI = {
  // Interpret voice utterance and create tasks
  interpretUtterance: (utterance) => api.post('/ai/interpret', { utterance }),
  
  // Chat with AI
  chat: (message) => api.post('/ai/chat', { message }),
  
  // Get chat history
  getChatHistory: () => api.get('/ai/chat/history'),
  
  // Clear chat history
  clearChatHistory: () => api.delete('/ai/chat/clear'),
  
  // Future self response
  futureSelf: (message) => api.post('/ai/future-self', { message })
};

// Voice API
export const voiceAPI = {
  // Check if voice feature is enabled
  isEnabled: () => api.get('/voice/enabled'),
  
  // Transcribe audio file to text
  transcribe: (formData) => api.post('/voice/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Process transcribed voice text
  transcribeAndReply: (text) => api.post('/voice/transcribe-and-reply', { text }),
  
  // Combined transcribe and process
  transcribeAndProcess: (formData) => api.post('/voice/transcribe-and-process', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  }),
  
  // Future self voice response
  futureSelf: (message) => api.post('/voice/future-self', { message })
};

// Payment API
export const paymentAPI = {
  // Get all payments
  getPayments: () => api.get('/payments'),
  
  // Add a new payment
  addPayment: (paymentData) => api.post('/payments', paymentData),
  
  // Mark payment as paid
  markPaid: (id) => api.patch(`/payments/${id}/paid`),
  
  // Delete a payment
  deletePayment: (id) => api.delete(`/payments/${id}`),
  
  // Detect payments from text (SMS/email simulation)
  detectFromText: (text, source) => api.post('/payments/detect', { text, source })
};

// Auth API
export const authAPI = {
  // Get current user info
  getMe: () => api.get('/auth/me'),
  
  // Logout
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  
  // Refresh token
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken })
};