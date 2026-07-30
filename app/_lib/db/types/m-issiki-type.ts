import { schema } from '../supabase';
import { Database } from './types';

export type MIsshikiDBValues = Database[schema]['Tables']['m_issiki']['Insert'];
