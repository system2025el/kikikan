import { z } from 'zod';

import { zodNumberText } from '../../_lib/membs';

export const BumonsMasterDialogSchema = z.object({
  bumonNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(200, '200文字以内で入力してください').optional(),
  daibumonId: zodNumberText,
  shukeibumonId: zodNumberText,
});

export type BumonsMasterDialogValues = z.infer<typeof BumonsMasterDialogSchema>;

export type BumonsMasterTableValues = {
  bumonId: number;
  bumonNam: string;
  mem: string;
  tblDspId: number;
  delFlg: boolean;
  // daibumonId: number;
  // shukeibumonId: number;
};
