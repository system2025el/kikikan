'use client';

import { createContext } from 'react';

import { User } from '../_lib/types';

const UserContext = createContext<User | undefined>(undefined);

export const UserProvider = ({ user, children }: { user: User; children: React.ReactNode }) => {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};
