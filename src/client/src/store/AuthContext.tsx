import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiClient } from '../services/api';

export interface User {
  id: string;
  email: string;
  username?: string | null;
  contactEmail?: string | null;
  name: string;
  role: string;
  organizationId: string;
}

export interface Business {
  id: string;
  name: string;
  websiteUrl: string;
  industry: string;
  description: string;
  productsAndServices: string[];
  targetAudience: string;
  targetLocations: string[];
  monthlyBudget: number;
  dailyBudgetLimit: number;
  brandColors: { primary: string; secondary: string; accent: string };
  brandTone: string;
  emergencyStop: boolean;
  profileAI?: any;
}

interface AuthContextType {
  user: User | null;
  business: Business | null;
  isLoading: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => void;
  refreshBusiness: () => Promise<void>;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('landing');

  const refreshBusiness = async () => {
    try {
      const res = await ApiClient.getActiveBusiness();
      if (res && res.business) {
        setBusiness(res.business);
      }
    } catch (e) {
      console.log('No active business loaded yet');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!ApiClient.hasToken()) return;

        const res = await ApiClient.getMe();
        if (res && res.user) {
          setUser(res.user);
          await refreshBusiness();
        }
      } catch (e) {
        console.log('User not logged in or running demo mode');
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (token: string, u: User) => {
    ApiClient.setToken(token);
    setUser(u);
    await refreshBusiness();
    if (u.role === 'SUPER_ADMIN') {
      setCurrentView('admin');
    } else {
      setCurrentView('dashboard');
    }
  };

  const logout = () => {
    ApiClient.clearToken();
    setUser(null);
    setBusiness(null);
    setCurrentView('landing');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        isLoading,
        login,
        logout,
        refreshBusiness,
        currentView,
        setCurrentView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
