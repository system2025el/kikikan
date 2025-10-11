import { strict } from 'assert';
import { number, z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

// Schema
export const RfidsMasterDialogSchema = z.object({
  tagId: z.string(),
  elNum: z.number().nullable(),
  shozokuId: z.number({ message: '選択してください' }).min(1, { message: '選択してください' }),
  rfidKizaiSts: number(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  delFlg: z.boolean().optional(),
});

export type RfidsMasterDialogValues = z.infer<typeof RfidsMasterDialogSchema>;

export type RfidsMasterTableValues = {
  rfidTagId: string;
  delFlg: boolean | null;
  mem: string | null;
  stsId: number | null;
  stsNam: string | null;
  elNum: number | null;
  tblDspId: number;
};
