import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const KeepJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    mem: z.string().nullable(),
    headNam: z
      .string({ message: validationMessages.required() })
      .min(1, { message: validationMessages.required() })
      .max(20, { message: validationMessages.maxStringLength(20) }),
    oyaJuchuKizaiHeadId: z.number(),
    kicsShukoDat: z.date().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardShukoDat: z.date().nullable(),
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

export type KeepJuchuKizaiHeadValues = z.infer<typeof KeepJuchuKizaiHeadSchema>;

export type KeepJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  shozokuId: number;
  shozokuNam: string;
  mem: string | null;
  kizaiId: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number;
  oyaPlanYobiQty: number;
  keepQty: number;
  indentNum: number;
  delFlag: boolean;
  saveFlag: boolean;
};

export type KeepJuchuContainerMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  mem: string | null;
  kizaiId: number;
  kizaiNam: string;
  oyaPlanKicsKizaiQty: number;
  oyaPlanYardKizaiQty: number;
  kicsKeepQty: number;
  yardKeepQty: number;
  delFlag: boolean;
  saveFlag: boolean;
};
