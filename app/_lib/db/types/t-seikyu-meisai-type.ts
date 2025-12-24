import { schema } from '../supabase';
import { Database } from './types';

export type SeikyuMeisai = Database[schema]['Tables']['t_seikyu_meisai']['Insert'];
