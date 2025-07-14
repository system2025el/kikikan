import { z } from 'zod';

export const BumonsMasterDialogSchema = z.object({
  bumonNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(200, '200文字以内で入力してください').optional(),
  daibumonId: z.number({ message: '数字を入力してください' }).optional(),
  shukeibumonId: z.number({ message: '数字を入力してください' }).optional(),
});

export type BumonsMasterDialogValues = z.infer<typeof BumonsMasterDialogSchema>;

export type BumonsMasterTableValues = {
  bumonId: number;
  bumonNam: string;
  mem: string;
  daibumonId: number;
  shukeibumonId: number;
  dspFlg: boolean;
};
