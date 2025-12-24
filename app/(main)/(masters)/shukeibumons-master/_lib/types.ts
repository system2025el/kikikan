import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const ShukeibumonsMasterDialogSchema = z.object({
  shukeibumonNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
});

export type ShukeibumonsMasterDialogValues = z.infer<typeof ShukeibumonsMasterDialogSchema>;

export type ShukeibumonsMasterTableValues = {
  delFlg: boolean | null;
  tblDspId: number;
  mem: string | null;
  shukeibumonId: number;
  shukeibumonNam: string;
};
