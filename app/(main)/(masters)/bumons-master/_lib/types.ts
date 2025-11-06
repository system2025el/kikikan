import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const BumonsMasterDialogSchema = z.object({
  bumonNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  daibumonId: z.number().int().nullish(),
  shukeibumonId: z.number().int().nullish(),
});
export type BumonsMasterDialogValues = z.infer<typeof BumonsMasterDialogSchema>;

export type BumonsMasterTableValues = {
  bumonId: number;
  bumonNam: string;
  // dai_bumon_id: number | null;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
  // shukei_bumon_id: number | null;
  // daibumonId: number;
  // shukeibumonId: number;
};
