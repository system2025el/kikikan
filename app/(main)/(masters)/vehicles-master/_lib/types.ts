import z from 'zod';

export const VehsMasterDialogSchema = z.object({
  sharyoNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
});

export type VehsMasterDialogValues = z.infer<typeof VehsMasterDialogSchema>;

export type VehsMasterTableValues = {
  sharyoId: number;
  sharyoNam: string;
  mem: string;
  dspFlg: boolean;
  dspOrdNum: number;
};
