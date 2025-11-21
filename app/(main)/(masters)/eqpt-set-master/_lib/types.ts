import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const EqptSetsMasterDialogSchema = z.object({
  eqptId: z.number(),
  setEqptList: z.array(z.object({ id: z.number(), nam: z.string() })),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
});

export type EqptSetsMasterDialogValues = z.infer<typeof EqptSetsMasterDialogSchema>;

export type EqptSetsMasterTableValues = {
  oyaEqptId: number;
  oyaEqptNam: number;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
};
