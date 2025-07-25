import { z } from 'zod';

export const UsersMaterDialogSchema = z.object({
  tantouNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  delFlg: z.boolean().optional(),
});
export type UsersMasterDialogValues = z.infer<typeof UsersMaterDialogSchema>;

export type UsersMasterTableValues = {
  tantouId: number;
  tantouNam: string;
  tblDspId: number;
  delFlg: boolean;
};
