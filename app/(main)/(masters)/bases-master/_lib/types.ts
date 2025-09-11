import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const BasesMasterDialogSchema = z.object({
  shozokuNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
});

export type BasesMasterDialogValues = z.infer<typeof BasesMasterDialogSchema>;

export type BasesMasterTableValues = {
  delFlg: boolean | null;
  tblDspId: number;
  mem: string | null;
  shozokuId: number;
  shozokuNam: string;
};
