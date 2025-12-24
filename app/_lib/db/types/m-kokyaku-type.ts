import { schema } from '../supabase';
import { Database } from './types';

export type MKokyakuDBValues = Database[schema]['Tables']['m_kokyaku']['Insert'];
