import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const VehsMasterDialogSchema = z.object({
  sharyoNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  dspFlg: z.boolean().optional(),
});

export type VehsMasterDialogValues = z.infer<typeof VehsMasterDialogSchema>;

export type VehsMasterTableValues = {
  delFlg: boolean | null;
  dspFlg: boolean | null;
  tblDspId: number;
  mem: string | null;
  sharyoId: number;
  sharyoNam: string;
};
