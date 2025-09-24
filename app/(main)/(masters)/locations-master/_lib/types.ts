import { z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const LocsMasterDialogSchema = z.object({
  locNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  kana: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  delFlg: z.boolean().optional(),
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
});

export type LocsMasterDialogValues = z.infer<typeof LocsMasterDialogSchema>;

export type LocsMasterTableValues = {
  adrShozai: string | null;
  adrSonota: string | null;
  adrTatemono: string | null;
  delFlg: boolean | null;
  dspFlg: boolean | null;
  tblDspId: number;
  fax: string | null;
  locId: number;
  locNam: string;
  mem: string | null;
  tel: string | null;
};

/* 検索用スキーマ */
export const LocsMasterSearchSchema = z.object({
  query: z.string().optional(),
});
export type LocsMasterSearchValues = z.infer<typeof LocsMasterSearchSchema>;
