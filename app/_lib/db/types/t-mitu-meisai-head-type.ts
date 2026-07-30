import { schema } from '../supabase';
import { Database } from './types';

export type MituMeisaiHead = Database[schema]['Tables']['t_mitu_meisai_head']['Insert'];
