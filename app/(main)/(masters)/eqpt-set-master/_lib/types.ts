import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const EqptSetsMasterDialogSchema = z.object({
  eqptId: z.number(),
  setEqptList: z.array(z.object({ id: z.number(), nam: z.string(), mem: z.string().nullish() })),
  delFlg: z.boolean().optional(),
});

export type EqptSetsMasterDialogValues = z.infer<typeof EqptSetsMasterDialogSchema>;

export type EqptSetsMasterTableValues = {
  oyaEqptId: number;
  oyaEqptNam: number;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
};
