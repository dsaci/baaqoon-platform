import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: 'super_admin' | 'admin' | 'supervisor' | 'subject_supervisor' | 'teacher' | 'student' | 'tech_support';
  status?: string;
  phone?: string;
  nationality?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, 
      token: localStorage.getItem('token'),
      
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      
      initialize: (user) => {
        set({ user });
      },
      
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
    }),
    {
      name: 'auth-store',
    }
  )
);
