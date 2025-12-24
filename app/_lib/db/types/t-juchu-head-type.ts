import { schema } from '../supabase';
import { Database } from './types';

export type JuchuHead = Database[schema]['Tables']['t_juchu_head']['Insert'];
