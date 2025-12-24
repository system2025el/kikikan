import { schema } from '../supabase';
import { Database } from './types';

export type NyushukoFix = Database[schema]['Tables']['t_nyushuko_fix']['Insert'];
