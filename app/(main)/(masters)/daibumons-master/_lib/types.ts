import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const DaibumonsMasterDialogSchema = z.object({
  daibumonNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
});

export type DaibumonsMasterDialogValues = z.infer<typeof DaibumonsMasterDialogSchema>;

export type DaibumonsMasterTableValues = {
  daibumonId: number;
  daibumonNam: string;
  delFlg: boolean | null;
  mem: string | null;
  tblDspId: number;
};
