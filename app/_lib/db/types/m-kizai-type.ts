import { schema } from '../supabase';
import { Database } from './types';

export type MKizaiDBValues = Database[schema]['Tables']['m_kizai']['Insert'];
