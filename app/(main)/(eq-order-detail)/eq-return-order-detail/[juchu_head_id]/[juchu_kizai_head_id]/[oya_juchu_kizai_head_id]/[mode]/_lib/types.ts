import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const ReturnJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    nebikiAmt: z
      .number()
      .max(99999999, { message: validationMessages.maxNumberLength(8) })
      .nullable(),
    mem: z.string().nullable(),
    headNam: z
      .string({ message: validationMessages.required() })
      .min(1, { message: validationMessages.required() })
      .max(20, { message: validationMessages.maxStringLength(20) }),
    oyaJuchuKizaiHeadId: z.number(),
    kicsNyukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: validationMessages.required(),
    path: ['yardNyukoDat'],
  });

export type ReturnJuchuKizaiHeadValues = z.infer<typeof ReturnJuchuKizaiHeadSchema>;

export type ReturnJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  shozokuId: number;
  shozokuNam: string;
  mem: string | null;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number | null;
  oyaPlanYobiQty: number | null;
  planKizaiQty: number | null;
  planYobiQty: number | null;
  planQty: number | null;
  delFlag: boolean;
  saveFlag: boolean;
};
