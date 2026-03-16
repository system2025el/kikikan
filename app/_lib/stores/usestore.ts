import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type User = {
  id: string;
  name: string;
  email: string;
  permission: {
    juchu: number;
    nyushuko: number;
    masters: number;
    loginSetting: number;
    ht: number;
    schedule: number;
  };
};

type UserState = {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'user-storage', // localStorage key
      //storage: createJSONStorage(() => sessionStorage),
    }
  )
);
