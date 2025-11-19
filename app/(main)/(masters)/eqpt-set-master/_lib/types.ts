import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const EqptSetsMasterDialogSchema = z.object({
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
});

export type EqptSetsMasterDialogValues = z.infer<typeof EqptSetsMasterDialogSchema>;

export type EqptSetsMasterTableValues = {
  eqptSetId: number;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
};
