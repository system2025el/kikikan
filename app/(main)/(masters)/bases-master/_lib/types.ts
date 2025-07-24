import { z } from 'zod';

export const BasesMasterDialogSchema = z.object({
  shozokuNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
});

export type BasesMasterDialogValues = z.infer<typeof BasesMasterDialogSchema>;

export type BasesMasterTableValues = {
  shozokuId: number;
  shozokuNam: string;
  mem: string;
  dspOrdNum: number;
};
