'use server';

import { supabase } from '@/app/_lib/db/supabase';

import { UserValues } from './types';

export const login = async (data: UserValues) => {
  try {
    return await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  } catch (e) {
    console.error(e);
    throw e;
  }
};
