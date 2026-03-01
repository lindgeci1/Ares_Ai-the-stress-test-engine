import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';
const TOKEN_COOKIE_NAME = 'jwt_token';

export interface Role {
  id: number;
  name: string;
  permissions: Record<string, any>;
}

export interface User {
  id: number;  // Backend returns number, not string
  email: string;
  operator_name: string;
  subscription_tier: string;
  status: string;
  roles: Role[];
  created_at: string;
  updated_at: string;
}

export interface RegisterData {
  email: string;
  password: string;
  operator_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message: string;
  token?: string;
}

export interface UpdateUserData {
  email?: string;
  subscription_tier?: string;
  status?: string;
}

export interface Document {
  id: number;
  user_id: number;
  file_name: string;
  cloudinary_url: string;
  raw_text?: string;
  status: string;
  audit_report?: any;
  audio_debate?: any;
  created_at: string;
  updated_at: string;
}

// Cookie helpers
const setCookie = (name: string, value: string): void => {
  // Note: Secure flag requires HTTPS in production. For localhost, browsers allow it.
  document.cookie = `${name}=${value};path=/;Secure;SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = `${name}=`;
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return cookie.substring(nameEQ.length);
    }
  }
  return null;
};

const clearCookie = (name: string): void => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;Secure;SameSite=Lax`;
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Add Authorization header with JWT token from cookies
axiosInstance.interceptors.request.use((config) => {
  const token = getCookie(TOKEN_COOKIE_NAME);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 and refresh token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors for protected API calls (NOT auth endpoints)
    // Auth endpoints are: login, logout, register, refresh
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      try {
        // Try to refresh the token
        const response = await axiosInstance.post('/auth/refresh');
        const newToken = response.data.token;

        if (newToken) {
          // Update token in cookie
          setCookie(TOKEN_COOKIE_NAME, newToken);
          // Update authorization header for retry
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          // Retry original request
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - session expired
        clearCookie(TOKEN_COOKIE_NAME);
        clearCookie('refresh_token');
        // Dispatch custom event that components can listen to
        window.dispatchEvent(new CustomEvent('SESSION_EXPIRED'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const authService = {
  // Register a new user
  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  },

  // Login user
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await axiosInstance.post<LoginResponse>('/auth/login', data);
      // Save JWT token to cookie from response
      if (response.data.token) {
        setCookie(TOKEN_COOKIE_NAME, response.data.token);
      }
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  },

  // Get all users
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await axiosInstance.get<User[]>('/users');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch users');
    }
  },

  // Get user by ID
  async getUserById(userId: number): Promise<User> {
    try {
      const response = await axiosInstance.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user');
    }
  },

  // Update user
  async updateUser(userId: number, data: UpdateUserData): Promise<User> {
    try {
      const response = await axiosInstance.put<User>(`/users/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update user');
    }
  },

  // Delete user
  async deleteUser(userId: number): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete user');
    }
  },

  // Logout user
  async logout(): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.post<{ message: string }>('/auth/logout');
      // Clear both JWT and refresh token cookies
      clearCookie(TOKEN_COOKIE_NAME);
      clearCookie('refresh_token');
      return response.data;
    } catch (error: any) {
      // Clear cookies even if logout fails
      clearCookie(TOKEN_COOKIE_NAME);
      clearCookie('refresh_token');
      throw new Error(error.response?.data?.error || 'Logout failed');
    }
  },

  // Get all documents (admin)
  async getAllDocuments(): Promise<Document[]> {
    try {
      const response = await axiosInstance.get<Document[]>('/documents');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch documents');
    }
  },

  // Get document by ID
  async getDocumentById(docId: number): Promise<Document> {
    try {
      const response = await axiosInstance.get<Document>(`/documents/${docId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch document');
    }
  },

  // Get user documents
  async getUserDocuments(userId: number): Promise<Document[]> {
    try {
      const response = await axiosInstance.get<Document[]>(`/documents/user/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch user documents');
    }
  },

  // Create document with file upload
  async createDocument(userId: number, file: File): Promise<Document> {
    try {
      const formData = new FormData();
      formData.append('user_id', String(userId));
      formData.append('file', file);

      const response = await axiosInstance.post<Document>('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to create document');
    }
  },

  // Update document
  async updateDocument(docId: number, updates: { file_name?: string; status?: string }): Promise<Document> {
    try {
      const response = await axiosInstance.put<Document>(`/documents/${docId}`, updates);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update document');
    }
  },

  // Delete document
  async deleteDocument(docId: number): Promise<{ message: string }> {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`/documents/${docId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to delete document');
    }
  },

  // Local storage helpers
  saveUserToStorage(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },

  getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  clearUserFromStorage(): void {
    localStorage.removeItem('user');
  },

  // Get role ID from user (convenience function)
  getRoleIdFromUser(user: User): number | null {
    if (!user.roles || user.roles.length === 0) return null;
    return user.roles[0].id;
  },

  // Check if user is admin
  isAdmin(user: User): boolean {
    const roleId = this.getRoleIdFromUser(user);
    return roleId === 1;
  },

  // Get current authenticated user with role info
  async getCurrentUser(): Promise<User> {
    try {
      const response = await axiosInstance.get<User>('/auth/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to fetch current user');
    }
  },

  // Token helpers
  getToken(): string | null {
    return getCookie(TOKEN_COOKIE_NAME);
  },

  clearToken(): void {
    clearCookie(TOKEN_COOKIE_NAME);
  },
};
