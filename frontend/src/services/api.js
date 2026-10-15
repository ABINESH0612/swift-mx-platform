const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('swift_mx_token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const parseResponse = async (res, defaultMsg = 'Request failed') => {
  const contentType = res.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = { message: defaultMsg };
    }
  } else {
    const text = await res.text();
    data = { message: text || defaultMsg };
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || defaultMsg);
  }
  return data;
};

export const api = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return await parseResponse(res, 'Health check failed');
    } catch {
      return { status: 'DOWN' };
    }
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await parseResponse(res, 'Invalid username or password');
    localStorage.setItem('swift_mx_token', data.token);
    localStorage.setItem('swift_mx_user', data.username);
    return data;
  },

  async logout() {
    const token = localStorage.getItem('swift_mx_token');
    try {
      if (token) {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: getAuthHeaders(),
        });
      }
    } finally {
      localStorage.removeItem('swift_mx_token');
      localStorage.removeItem('swift_mx_user');
    }
  },

  async checkAuth() {
    const token = localStorage.getItem('swift_mx_token');
    if (!token) return { authenticated: false };

    try {
      const res = await fetch(`${API_BASE}/auth/check`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        this.clearSession();
        return { authenticated: false };
      }
      const data = await parseResponse(res, 'Auth check failed');
      if (!data.authenticated) {
        this.clearSession();
      }
      return data;
    } catch {
      return { authenticated: false };
    }
  },

  clearSession() {
    localStorage.removeItem('swift_mx_token');
    localStorage.removeItem('swift_mx_user');
  },

  async processXml(xmlContent) {
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ xmlContent }),
    });

    return await parseResponse(res, 'Failed to process SWIFT MX message');
  },

  async uploadXmlFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/messages/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    return await parseResponse(res, 'Failed to upload and process XML file');
  },

  async getMessages() {
    const res = await fetch(`${API_BASE}/messages`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      this.clearSession();
      throw new Error('Session expired. Please log in again.');
    }

    return await parseResponse(res, 'Failed to fetch messages');
  },

  async searchMessages(query) {
    const encoded = encodeURIComponent(query || '');
    const res = await fetch(`${API_BASE}/messages/search?query=${encoded}`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      this.clearSession();
      throw new Error('Session expired. Please log in again.');
    }

    return await parseResponse(res, 'Failed to search messages');
  },

  async getMessageById(id) {
    const res = await fetch(`${API_BASE}/messages/${id}`, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      this.clearSession();
      throw new Error('Session expired. Please log in again.');
    }

    return await parseResponse(res, 'Failed to retrieve message details');
  },
};
