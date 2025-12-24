import { schema } from '../supabase';
import { Database } from './types';

export type Lock = Database[schema]['Tables']['t_lock']['Insert'];
