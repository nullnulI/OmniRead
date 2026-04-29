/* Copyright (c) 2026, Yao Zeran
 * 
 * The authenticated pages' context, contains the current user info. */


"use client";


import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { User } from "@/types/user";
import { fetchCurrentUser } from "@/services/api/auth";
import { getToken, clearToken } from "@/utils/jwt";


export const exampleReader: User = {
  id: 'reader-001',
  email: 'reader@example.com',
  name: 'Ari Reader',
  role: 'reader',
  subscribedAuthors: [],
  metadata : {
    id: 'reader-001',
    email: 'reader@example.com',
    name: 'Ari Reader',
  },
  profile : {
    role: 'reader',
    id: 'reader-001',
  }
};
export const exampleAuthor: User = {
  id: 'author-001',
  email: 'author@example.com',
  name: 'Mina Author',
  role: 'author',
  subscribedAuthors: [],
  metadata : {
    id: 'author-001',
    email: 'author@example.com',
    name: 'Mina Author',
  },
  profile : {
    role: 'author',
    id: 'reader-001',
    authorBio: 'Writes fantasy stories about trade, travel, and folklore.',
    penName: 'M. Aster',
  }
};


interface AuthContext {
  user: User | null;
  setUser: (user: User) => void,
  logout: () => void,
  isAuthenticated: boolean,
  isLoading: boolean,
}
const AuthContext = createContext<AuthContext | null>(null);


function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreUser() {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreUser();
  }, []);
  
  const logout = () => {
    clearToken();
    setUser(null);
  };
  
  const isAuthenticated = Boolean(user && getToken());
  
  return (
    <AuthContext.Provider value={{ user, setUser, logout, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};


const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within a AuthProvider");
  }
  return context;
};


export { useAuthContext };
export default AuthProvider;
