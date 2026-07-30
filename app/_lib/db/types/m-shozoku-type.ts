import { schema } from '../supabase';
import { Database } from './types';

export type MShozokuDBValues = Database[schema]['Tables']['m_shozoku']['Insert'];
