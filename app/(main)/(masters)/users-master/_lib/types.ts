import { string, z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const UsersMaterDialogSchema = z.object({
  mailAdr: string()
    .email({ message: validationMessages.email() })
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  tantouNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  shainCod: string().nullish(),
  psermission: z.object({
    juchu: string(),
    nyushuko: string(),
    masters: string(),
    loginSetting: string(),
    ht: string(),
  }),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  delFlg: z.boolean().optional(),
  lastLoginAt: z.string().nullable(),
});
export type UsersMasterDialogValues = z.infer<typeof UsersMaterDialogSchema>;

export type UsersMasterTableValues = {
  tantouNam: string;
  mailAdr: string;
  shainCod: string | null;
  mem: string | null;
  lastLogin: string | null;
  tblDspId: number;
  delFlg: boolean | null;
};
