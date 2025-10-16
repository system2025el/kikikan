import { schema } from '../supabase';
import { Database } from './types';

export type SeikyuDatJuchuKizai = Database[schema]['Tables']['t_seikyu_date_juchu_kizai']['Insert'];
