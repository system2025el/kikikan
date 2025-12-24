import { schema } from '../supabase';
import { Database } from './types';

export type MituMeisai = Database[schema]['Tables']['t_mitu_meisai']['Insert'];
