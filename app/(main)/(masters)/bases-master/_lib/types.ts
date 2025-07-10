import { z } from 'zod';

export const BasesMasterDialogSchema = z.object({
  kyotenNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
});

export type BasesMasterDialogValues = z.infer<typeof BasesMasterDialogSchema>;

export type BasesMasterTableValues = {
  kyotenId: number;
  kyotenNam: string;
  delFlg: boolean;
  mem: string;
  dspFlg: boolean;
};
