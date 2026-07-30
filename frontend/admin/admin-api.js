/**
 * UndrGradz Admin API Client
 * Manages administrative API requests, JWT tokens, session headers, and error handling.
 */
class AdminApiClient {
  constructor() {
    const hostname = window.location.hostname;
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || window.location.port === '8080';
    const host = (hostname === 'localhost' || hostname === '127.0.0.1') ? hostname : 'localhost';
    
    const remoteUrl = 'https://mazda-specify-subsequent-genesis.trycloudflare.com';
    this.baseUrl = isLocal
      ? `http://${host}:3000/api/v1/admin`
      : `${remoteUrl}/api/v1/admin`;

    this.tokenKey = 'undrgradz_admin_token';
    this.userKey = 'undrgradz_admin_user';
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
  }

  getAdminUser() {
    const data = localStorage.getItem(this.userKey);
    return data ? JSON.parse(data) : null;
  }

  setAdminUser(user) {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          if (!endpoint.includes('/auth/login')) {
            console.warn('⚠️ Admin session unauthorized or expired.');
          }
        }
        throw new Error(data.message || 'Error executing administrative request');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // AUTH API
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (data.status === 'success' && data.data) {
      this.setToken(data.data.accessToken);
      this.setAdminUser(data.data.adminUser);
    }
    return data;
  }

  // DASHBOARD & SEARCH
  async getDashboard() {
    return this.request('/dashboard');
  }

  async globalSearch(query) {
    return this.request(`/search?q=${encodeURIComponent(query)}`);
  }

  // USERS
  async getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users?${query}`);
  }

  async getUserDetails(id) {
    return this.request(`/users/${id}`);
  }

  async updateUserStatus(id, payload) {
    return this.request(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async softDeleteUser(id) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async updateUserRole(id, role) {
    return this.request(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  // MODERATION
  async getReports(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/moderation/reports?${query}`);
  }

  async resolveReport(id, payload) {
    return this.request(`/moderation/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  // UNIVERSITIES
  async getUniversities(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/universities?${query}`);
  }

  async getUniversityDetails(id) {
    return this.request(`/universities/${id}`);
  }

  async createUniversity(payload) {
    return this.request('/universities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateUniversity(id, payload) {
    return this.request(`/universities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async softDeleteUniversity(id) {
    return this.request(`/universities/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreUniversity(id) {
    return this.request(`/universities/${id}/restore`, {
      method: 'POST',
    });
  }

  // EVENTS
  async getEvents(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/events?${query}`);
  }

  async updateEventStatus(id, status) {
    return this.request(`/events/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async softDeleteEvent(id) {
    return this.request(`/events/${id}`, {
      method: 'DELETE',
    });
  }

  // CONTENT
  async deletePhoto(id) {
    return this.request(`/content/photo/${id}`, {
      method: 'DELETE',
    });
  }

  // ADMINISTRATORS
  async getAdministrators() {
    return this.request('/administrators');
  }

  async createAdministrator(payload) {
    return this.request('/administrators', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // SESSIONS
  async getSessions() {
    return this.request('/sessions');
  }

  async revokeSession(id) {
    return this.request(`/sessions/${id}/revoke`, {
      method: 'POST',
    });
  }

  // AUDIT LOGS
  async getAuditLogs(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/audit-logs?${query}`);
  }

  // NOTIFICATIONS
  async sendNotification(payload) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // SETTINGS
  async getSettings() {
    return this.request('/settings');
  }

  async updateSetting(key, value, description) {
    return this.request('/settings', {
      method: 'PATCH',
      body: JSON.stringify({ key, value, description }),
    });
  }

  // ANALYTICS & CHARTS
  async getAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics?${query}`);
  }

  getAnalyticsExportUrl(format = 'xlsx') {
    const token = this.getToken();
    return `${this.baseUrl}/analytics/export/${format}?token=${token}`;
  }

  // VERIFICATIONS & CREATOR BADGES
  async getVerifications(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/verifications?${query}`);
  }

  async approveVerification(id, adminNotes = '') {
    return this.request(`/verifications/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ adminNotes }),
    });
  }

  async rejectVerification(id, rejectionReason = '') {
    return this.request(`/verifications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  async updateUserVerifications(userId, payload) {
    return this.request(`/users/${userId}/verifications`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }
}

window.adminApi = new AdminApiClient();
