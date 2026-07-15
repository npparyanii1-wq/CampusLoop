import { create } from 'zustand';
import { api } from '../api';
import type { User, LoginResponse } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    faculty: string;
    departmentId?: number;
  }) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password });
      localStorage.setItem('cl_token', res.access_token);
      localStorage.setItem('cl_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.access_token, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  register: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<LoginResponse>('/auth/register', data);
      localStorage.setItem('cl_token', res.access_token);
      localStorage.setItem('cl_user', JSON.stringify(res.user));
      set({ user: res.user, token: res.access_token, loading: false });
    } catch (err: unknown) {
      set({ loading: false, error: (err as Error).message });
    }
  },

  logout: () => {
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_user');
    set({ user: null, token: null });
  },

  hydrate: () => {
    const token = localStorage.getItem('cl_token');
    const userStr = localStorage.getItem('cl_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ user, token });
      } catch {
        localStorage.removeItem('cl_token');
        localStorage.removeItem('cl_user');
      }
    }
  },

  clearError: () => set({ error: null }),
}));
