import { schema } from '../supabase';
import { Database } from './types';

export type MUserDBValues = Database[schema]['Tables']['m_user']['Insert'];
