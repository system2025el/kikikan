import { schema } from '../supabase';
import { Database } from './types';

export type SeikyuHead = Database[schema]['Tables']['t_seikyu_head']['Insert'];
