import { schema } from '../supabase';
import { Database } from './types';

export type MSectionDBValues = Database[schema]['Tables']['m_section']['Insert'];
