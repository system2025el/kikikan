import { schema } from '../supabase';
import { Database } from './types';

export type MRfidDBValues = Database[schema]['Tables']['m_rfid']['Insert'];
