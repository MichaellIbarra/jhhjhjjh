
'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { LegacyUser, LegacyUserRole } from '@/types'; // Updated import
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  currentUser: LegacyUser | null; // Updated type
  isAuthLoading: boolean;
  login: (email: string, passwordAttempt: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (name: string, email: string, passwordHint: string, role: LegacyUserRole) => Promise<{ success: boolean, message: string }>; // Updated type
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialDefaultUsers: LegacyUser[] = [ // Updated type
  { id: 'super1', name: 'Admin General', email: 'admin@eduassist.com', role: 'superuser', avatarSeed: 'admin@eduassist.com', passwordHint: 'super1' },
  { id: 'normal1', name: 'Profesor Ejemplo', email: 'profesor@eduassist.com', role: 'normal', avatarSeed: 'profesor@eduassist.com', passwordHint: 'normal1' },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUserInternal] = useState<LegacyUser | null>(null); // Updated type
  const [users, setUsers] = useState<LegacyUser[]>(initialDefaultUsers); // Updated type
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        try {
          setUsers(JSON.parse(storedUsers));
        } catch (e) {
          console.error("Failed to parse stored users:", e);
          localStorage.removeItem('users'); 
          setUsers(initialDefaultUsers); 
        }
      } else {
        localStorage.setItem('users', JSON.stringify(initialDefaultUsers));
      }

      const storedCurrentUser = localStorage.getItem('currentUser');
      if (storedCurrentUser) {
        try {
          setCurrentUserInternal(JSON.parse(storedCurrentUser));
        } catch (e) {
          console.error("Failed to parse stored current user:", e);
          localStorage.removeItem('currentUser'); 
        }
      }
      setIsAuthLoading(false); 
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthLoading) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users, isAuthLoading]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !isAuthLoading) { 
      if (currentUser) {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('currentUser');
      }
    }
  }, [currentUser, isAuthLoading]);

  const login = async (email: string, passwordAttempt: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300)); 
    const userToLogin = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHint === passwordAttempt
    );
    if (userToLogin) {
      setCurrentUserInternal(userToLogin);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUserInternal(null);
  };

  const registerUser = async (name: string, email: string, passwordHint: string, role: LegacyUserRole): Promise<{ success: boolean, message: string }> => { // Updated type
    await new Promise(resolve => setTimeout(resolve, 300));
    const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return { success: false, message: "Este correo electrónico ya está registrado." };
    }

    const newUser: LegacyUser = { // Updated type
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      name,
      email,
      passwordHint, 
      role,
      avatarSeed: email,
    };

    setUsers(prevUsers => [...prevUsers, newUser]);
    return { success: true, message: "Usuario registrado exitosamente." };
  };

  return (
    <AuthContext.Provider value={{ currentUser, isAuthLoading, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
