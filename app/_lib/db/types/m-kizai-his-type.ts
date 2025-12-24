import { schema } from '../supabase';
import { Database } from './types';

export type MKizaiHisDBValues = Database[schema]['Tables']['m_kizai_his']['Insert'];
