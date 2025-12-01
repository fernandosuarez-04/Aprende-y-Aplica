'use client';

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => void;
}

// Helper para guardar en localStorage
const saveToStorage = (user: User | null, isAuthenticated: boolean) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('auth-storage', JSON.stringify({
      user,
      isAuthenticated,
    }));
  } catch (error) {
    console.error('Error saving auth state:', error);
  }
};

// Helper para cargar de localStorage
const loadFromStorage = (): { user: User | null; isAuthenticated: boolean } => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }

  try {
    const saved = localStorage.getItem('auth-storage');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        user: parsed.user,
        isAuthenticated: parsed.isAuthenticated,
      };
    }
  } catch (error) {
    console.error('Error loading auth state:', error);
  }

  return { user: null, isAuthenticated: false };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // TODO: Implementar llamada a API real
      // const response = await apiService.post('/auth/login', { email, password });

      // Simulación de login exitoso
      const mockUser: User = {
        id: '1',
        email,
        name: 'Usuario Demo',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('accessToken', 'mock-access-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      set({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });

      saveToStorage(mockUser, true);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    saveToStorage(null, false);
  },

  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
    });

    saveToStorage(user, !!user);
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  initializeAuth: () => {
    if (typeof window === 'undefined') return;

    const { user, isAuthenticated } = loadFromStorage();
    set({ user, isAuthenticated });
  },
}));
