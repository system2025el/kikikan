import { z } from 'zod';

export const ShukeibumonsMasterDialogSchema = z.object({
  shukeibumonNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional().nullable(),
});

export type ShukeibumonsMasterDialogValues = z.infer<typeof ShukeibumonsMasterDialogSchema>;

export type ShukeibumonsMasterTableValues = {
  delFlg: boolean | null;
  tblDspId: number;
  mem: string | null;
  shukeibumonId: number;
  shukeibumonNam: string;
};
