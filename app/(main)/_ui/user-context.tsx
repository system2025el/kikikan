'use client';

import { createContext, useContext } from 'react';

import { User } from '../_lib/types';

const UserContext = createContext<User | undefined>(undefined);

export const UserProvider = ({ user, children }: { user: User; children: React.ReactNode }) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
