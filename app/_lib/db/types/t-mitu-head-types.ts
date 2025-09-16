import { schema } from '../supabase';
import { Database } from './types';

export type MituHead = Database[schema]['Tables']['t_mitu_head']['Insert'];
