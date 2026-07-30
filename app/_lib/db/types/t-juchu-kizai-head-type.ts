import { schema } from '../supabase';
import { Database } from './types';

export type JuchuKizaiHead = Database[schema]['Tables']['t_juchu_kizai_head']['Insert'];
