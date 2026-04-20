import { createContext, useContext } from 'react';
import type { AuthUser, UserRole } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  role: UserRole;
  login: (role: UserRole) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: 'admin',
  login: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
