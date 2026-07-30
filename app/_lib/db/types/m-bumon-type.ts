import { schema } from '../supabase';
import { Database } from './types';

export type MBumonDBValues = Database[schema]['Tables']['m_bumon']['Insert'];
