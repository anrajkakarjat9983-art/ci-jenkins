/* REST API Wrapper Client for Enterprise 4-Panel Placement Platform */

const API_BASE = '/api';

const API = {
  // Authentication
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  // Stats & Analytics (8 Key Cards)
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return await res.json();
  },

  // Companies
  async getCompanies() {
    const res = await fetch(`${API_BASE}/companies`);
    return await res.json();
  },

  async createCompany(compData) {
    const res = await fetch(`${API_BASE}/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(compData)
    });
    return await res.json();
  },

  // Drives
  async getDrives(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/drives?${params.toString()}`);
    return await res.json();
  },

  async createDrive(driveData) {
    const res = await fetch(`${API_BASE}/drives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driveData)
    });
    return await res.json();
  },

  async updateDrive(id, driveData) {
    const res = await fetch(`${API_BASE}/drives/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(driveData)
    });
    return await res.json();
  },

  // Students
  async getStudents(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/students?${params.toString()}`);
    return await res.json();
  },

  async updateStudent(id, studentData) {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    return await res.json();
  },

  exportStudentsUrl() {
    return `${API_BASE}/students/export`;
  },

  // Applications
  async getApplications(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/applications?${params.toString()}`);
    return await res.json();
  },

  async applyToDrive(studentId, driveId) {
    const res = await fetch(`${API_BASE}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, driveId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to apply');
    return data;
  },

  async updateApplicationStatus(appId, statusData) {
    const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(statusData)
    });
    return await res.json();
  },

  // Shortlists
  async getShortlists() {
    const res = await fetch(`${API_BASE}/shortlists`);
    return await res.json();
  },

  // Interviews
  async getInterviews(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/interviews?${params.toString()}`);
    return await res.json();
  },

  async scheduleInterview(interviewData) {
    const res = await fetch(`${API_BASE}/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interviewData)
    });
    return await res.json();
  },

  // Placements
  async getPlacements() {
    const res = await fetch(`${API_BASE}/placements`);
    return await res.json();
  },

  // Notifications
  async getNotifications(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/notifications?${params.toString()}`);
    return await res.json();
  },

  async createNotification(noticeData) {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noticeData)
    });
    return await res.json();
  },

  // Document Management (<5 MB Limit)
  async getDocuments(filters = {}) {
    const params = new URLSearchParams(filters);
    const res = await fetch(`${API_BASE}/documents?${params.toString()}`);
    return await res.json();
  },

  async uploadDocument(docData) {
    const res = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload document');
    return data;
  },

  async updateDocumentStatus(docId, status, notes = '') {
    const res = await fetch(`${API_BASE}/documents/${docId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    return await res.json();
  },

  async deleteDocument(docId) {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete document');
    return data;
  }
};

