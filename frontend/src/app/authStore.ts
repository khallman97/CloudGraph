import { create } from 'zustand';
import {
  login as apiLogin,
  signup as apiSignup,
  getCurrentUser,
  getToken,
  setToken,
  removeToken,
  type User,
  type LoginCredentials,
  type SignupData,
} from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!getToken(),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiLogin(credentials);
      setToken(response.access_token);

      const user = await getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  signup: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await apiSignup(data);
      // After signup, log them in automatically
      const response = await apiLogin({ email: data.email, password: data.password });
      setToken(response.access_token);

      const user = await getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Signup failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    removeToken();
    set({ user: null, isAuthenticated: false, error: null });
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    set({ isLoading: true });
    try {
      const user = await getCurrentUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      removeToken();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
