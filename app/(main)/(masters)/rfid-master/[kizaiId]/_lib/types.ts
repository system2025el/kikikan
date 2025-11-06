import { strict } from 'assert';
import { number, z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

// Schema
export const RfidsMasterDialogSchema = z.object({
  tagId: z
    .string()
    .length(24, '24文字で入力してください')
    .refine((val) => /^[a-zA-Z0-9]+$/.test(val), {
      message: '半角英数字のみで入力してください',
    }),
  elNum: z
    .number({ message: '入力してください' })
    .int({ message: validationMessages.int() })
    .min(1, { message: '1以上の整数で入力してください' }),
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
  shozokuId: number;
  elNum: number | null;
  tblDspId: number;
};
