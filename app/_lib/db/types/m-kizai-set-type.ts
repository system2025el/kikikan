import { schema } from '../supabase';
import { Database } from './types';

export type MKizaiSetDBValues = Database[schema]['Tables']['m_kizai_set']['Insert'];
