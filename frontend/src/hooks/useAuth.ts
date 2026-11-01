import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { User, AuthResponse } from '../types';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('df_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('df_token', data.token);
    localStorage.setItem('df_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const { data } = await api.post<AuthResponse>('/auth/register', { email, password, name });
    localStorage.setItem('df_token', data.token);
    localStorage.setItem('df_user', JSON.stringify(data.user));
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('df_token');
    localStorage.removeItem('df_user');
    setUser(null);
  }, []);

  return { user, login, register, logout };
}
