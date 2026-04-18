import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  getCurrentUser,
  setCurrentUser,
  getUsers,
  saveUsers,
  hashPassword,
  initializeApp,
  generateId,
  getAdminSettings,
} from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  updateProfile: (updates: { displayName?: string; newPassword?: string }) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp().then(() => {
      const saved = getCurrentUser();
      setUser(saved);
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const users = getUsers();
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!found) return { success: false, error: 'User not found' };
    
    const hash = await hashPassword(password);
    if (hash !== found.passwordHash) return { success: false, error: 'Invalid password' };

    if (!found.approved && found.role !== 'admin') {
      return { success: false, error: 'Your account has been deactivated. Please contact support.' };
    }

    found.lastLogin = new Date().toISOString();
    saveUsers(users);
    setCurrentUser(found);
    setUser(found);
    return { success: true };
  }, []);

  const signup = useCallback(async (username: string, password: string) => {
    const users = getUsers();
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'Username already exists' };
    }
    const hash = await hashPassword(password);
    const newUser: User = {
      id: generateId(),
      username,
      displayName: username,
      passwordHash: hash,
      role: 'user',
      approved: true, // Always approved now
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    users.push(newUser);
    saveUsers(users);
    return { success: true, error: 'Account created! You can now sign in.' };
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (updates: { displayName?: string; newPassword?: string }) => {
    if (!user) return { success: false, error: 'Not logged in' };
    const users = getUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx < 0) return { success: false, error: 'User not found' };

    if (updates.displayName) {
      users[idx].displayName = updates.displayName;
    }
    if (updates.newPassword) {
      users[idx].passwordHash = await hashPassword(updates.newPassword);
    }
    saveUsers(users);
    setCurrentUser(users[idx]);
    setUser({ ...users[idx] });
    return { success: true };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, isAdmin: user?.role === 'admin', updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
