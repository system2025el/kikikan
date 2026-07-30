import { schema } from '../supabase';
import { Database } from './types';

export type NyushukoResult = Database[schema]['Tables']['t_nyushuko_result']['Insert'];
