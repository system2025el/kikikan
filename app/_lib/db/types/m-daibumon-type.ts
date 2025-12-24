import { schema } from '../supabase';
import { Database } from './types';

export type MDaibumonDBValues = Database[schema]['Tables']['m_dai_bumon']['Insert'];
