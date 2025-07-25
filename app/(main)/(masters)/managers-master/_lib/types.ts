import { z } from 'zod';

export const managersMaterDialogSchema = z.object({
  tantouNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
});
export type ManagersMasterDialogValues = z.infer<typeof managersMaterDialogSchema>;

export type ManagersMasterTableValues = {
  tantouId: number;
  tantouNam: string;
  dspFlg: boolean;
  dspOrdNum: number;
  delFlg: boolean;
};
