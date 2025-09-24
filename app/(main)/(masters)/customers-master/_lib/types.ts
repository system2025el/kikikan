import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const CustomersMaterDialogSchema = z.object({
  kokyakuNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  kana: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  kokyakuRank: z.number({ message: validationMessages.number() }),
  delFlg: z.boolean().optional(),
  keisho: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  adrPost: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  adrShozai: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
  adrTatemono: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
  adrSonota: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
  tel: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  telMobile: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  fax: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  mail: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), { message: validationMessages.email() })
    .optional()
    .nullable(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  dspFlg: z.boolean().optional(),
  closeDay: z.number({ message: validationMessages.number() }).nullable(),
  siteDay: z.number({ message: validationMessages.number() }).nullable(),
  kizaiNebikiFlg: z.boolean().optional(),
});
export type CustomersMasterDialogValues = z.infer<typeof CustomersMaterDialogSchema>;

export type CustomersMasterTableValues = {
  adrShozai: string | null;
  adrSonota: string | null;
  adrTatemono: string | null;
  delFlg?: boolean | null;
  dspFlg: boolean | null;
  tblDspId: number;
  fax: string | null;
  kokyakuId: number;
  kokyakuNam: string;
  mem: string | null;
  tel: string | null;
};
