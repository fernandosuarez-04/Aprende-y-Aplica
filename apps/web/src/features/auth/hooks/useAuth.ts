'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '../actions/logout';

interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  cargo_rol?: string;
  type_rol?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        // Hacer una llamada al servidor para obtener el usuario actual
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();
  }, [router]);

  const logout = async () => {
    try {
      setLoading(true);
      await logoutAction();
      // El logoutAction ya maneja la redirección
    } catch (error) {
      console.error('Error during logout:', error);
      // Fallback: limpiar estado local y redirigir
      setUser(null);
      router.push('/auth');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
  };
}
