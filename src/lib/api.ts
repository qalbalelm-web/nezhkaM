import { AuthUser, ITeacher, IVideo, StorageMetrics } from '../types/index.js';

const TOKEN_KEY = 'science_heart_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'حدث خطأ غير متوقع أثناء معالجة الطلب');
  }

  return data as T;
}

export const api = {
  // Setup
  async checkSetupStatus(): Promise<{ isSetupComplete: boolean; hasAdmin: boolean; adminCount: number }> {
    return request('/api/setup/status');
  },

  async performSetup(username: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await request<{ success: boolean; token: string; user: AuthUser }>('/api/setup', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  // Auth
  async login(identifier: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async adminLogin(username: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async teacherLogin(teacherId: string, password: string): Promise<{ success: boolean; token: string; user: AuthUser }> {
    const res = await request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/teacher-login', {
      method: 'POST',
      body: JSON.stringify({ teacherId, password }),
    });
    if (res.token) {
      setStoredToken(res.token);
    }
    return res;
  },

  async getMe(): Promise<{ user: AuthUser }> {
    return request('/api/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      clearStoredToken();
    }
  },

  // Admin
  async getTeachers(): Promise<{ teachers: ITeacher[] }> {
    return request('/api/admin/teachers');
  },

  async createTeacher(payload: { teacherId: string; name: string; password: string; pixeldrainApiKey: string }): Promise<{ success: boolean; teacher: ITeacher }> {
    return request('/api/admin/teachers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteTeacher(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/admin/teachers/${id}`, {
      method: 'DELETE',
    });
  },

  async getStorageMetrics(): Promise<{ metrics: StorageMetrics }> {
    return request('/api/admin/metrics');
  },

  async getDatabaseStatus(): Promise<{
    isMongoConnected: boolean;
    storageType: string;
    maskedUri: string | null;
    teachersCount: number;
    videosCount: number;
  }> {
    return request('/api/admin/database-status');
  },

  async updateMongoConnection(mongodbUri: string): Promise<{ success: boolean; message: string }> {
    return request('/api/admin/database-connect', {
      method: 'POST',
      body: JSON.stringify({ mongodbUri }),
    });
  },

  async exportBackup(): Promise<any> {
    return request('/api/admin/backup');
  },

  async restoreBackup(payload: any): Promise<{ success: boolean; message: string; restoredTeachers: number; restoredVideos: number }> {
    return request('/api/admin/restore', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Teacher
  async getTeacherProfile(): Promise<{ teacher: ITeacher }> {
    return request('/api/teacher/profile');
  },

  async getUploadCredentials(): Promise<{ uploadUrl: string; apiKey: string; teacherId: string }> {
    return request('/api/teacher/upload-credentials');
  },

  async getMyVideos(): Promise<{ videos: IVideo[] }> {
    return request('/api/teacher/videos');
  },

  async registerVideo(payload: { videoId: string; title: string; fileSize: number }): Promise<{ success: boolean; video: IVideo }> {
    return request('/api/teacher/videos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteMyVideo(id: string): Promise<{ success: boolean; message: string }> {
    return request(`/api/teacher/videos/${id}`, {
      method: 'DELETE',
    });
  },
};
