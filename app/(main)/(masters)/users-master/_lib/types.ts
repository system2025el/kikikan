import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const UsersMaterDialogSchema = z.object({
  tantouNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
});
export type UsersMasterDialogValues = z.infer<typeof UsersMaterDialogSchema>;

export type UsersMasterTableValues = {
  tantouNam: string;
  mailAdr: string | null;
  shainCod: string | null;
  mem: string | null;
  lastLogin: string | null;
  tblDspId: number;
  delFlg: boolean | null;
};
