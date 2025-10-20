import { schema } from '../supabase';
import { Database } from './types';

export type RfidStatusResultValues = Database[schema]['Tables']['t_rfid_status_result']['Insert'];
