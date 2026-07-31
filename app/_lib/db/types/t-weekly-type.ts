import { schema } from '../schema';
import { Database } from './types';

export type TWeeklyValues = Database[schema]['Tables']['t_weekly']['Insert'];
