import { z } from 'zod';

export const DaibumonsMasterDialogSchema = z.object({
  daibumonNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
});

export type DaibumonsMasterDialogValues = z.infer<typeof DaibumonsMasterDialogSchema>;

export type DaibumonsMasterTableValues = {
  daibumonId: number;
  daibumonNam: string;
  mem: string;
};
