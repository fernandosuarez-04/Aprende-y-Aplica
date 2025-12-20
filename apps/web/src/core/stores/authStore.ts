'use client';

import { create } from 'zustand';

// ⚠️ SECURITY FIX: Este store ya NO usa persist para evitar que datos de usuarios
// se filtren entre sesiones. El usuario real se obtiene siempre del servidor via useAuth().
// Este store solo se mantiene por compatibilidad con código legacy.

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
}

// ⚠️ NO usar este store para autenticación real
// Usar useAuth() de features/auth/hooks/useAuth.ts en su lugar
export const useAuthStore = create<AuthState>()(
  (set) => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,

    login: async (_email: string, _password: string) => {
      // ⚠️ DEPRECATED: No usar este método
      // Usar el server action de login en features/auth/actions/login.ts
      console.warn('⚠️ useAuthStore.login() está deprecated. Usar server action de login.');
      set({ isLoading: false });
    },

    logout: () => {
      // Limpiar localStorage de cualquier dato residual de auth
      if (typeof window !== 'undefined') {
        // Limpiar el storage antiguo que podría tener datos persistidos
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    },

    setUser: (user: User | null) => {
      set({
        user,
        isAuthenticated: !!user,
      });
    },

    setLoading: (loading: boolean) => {
      set({ isLoading: loading });
    },
  })
);

// ⚠️ SECURITY: Limpiar localStorage al cargar si hay datos residuales
// Esto asegura que datos de sesiones anteriores no contaminen nuevas sesiones
if (typeof window !== 'undefined') {
  // Limpiar el storage antiguo al inicializar
  const oldStorage = localStorage.getItem('auth-storage');
  if (oldStorage) {
    console.warn('🔒 Security: Limpiando datos de auth residuales del localStorage');
    localStorage.removeItem('auth-storage');
  }
}
