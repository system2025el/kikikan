import { schema } from '../supabase';
import { Database } from './types';

export type MSharyoDBValues = Database[schema]['Tables']['m_sharyo']['Insert'];
