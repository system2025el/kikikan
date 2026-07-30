import { schema } from '../supabase';
import { Database } from './types';

export type TWeeklyValues = Database[schema]['Tables']['t_weekly']['Insert'];
