import { nullable, z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const JuchuKizaiHeadSchema = z
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
    kicsShukoDat: z.date().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardShukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: '',
    path: ['kicsShukoDat'],
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: validationMessages.required(),
    path: ['yardShukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: validationMessages.required(),
    path: ['yardNyukoDat'],
  });

export type JuchuKizaiHeadValues = z.infer<typeof JuchuKizaiHeadSchema>;

export type JuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  idoDenId: number | null;
  sagyoDenDat: Date | null;
  sagyoSijiId: number | null;
  mShozokuId: number;
  shozokuId: number;
  shozokuNam: string;
  mem: string | null;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  kizaiQty: number;
  planKizaiQty: number | null;
  planYobiQty: number | null;
  planQty: number | null;
  delFlag: boolean;
  saveFlag: boolean;
};

export type JuchuContainerMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  kizaiId: number;
  kizaiNam: string;
  planKicsKizaiQty: number | null;
  planYardKizaiQty: number | null;
  planQty: number | null;
  mem: string | null;
  delFlag: boolean;
  saveFlag: boolean;
};

export type StockTableValues = {
  calDat: Date;
  kizaiId: number;
  kizaiQty: number;
  juchuQty: number;
  zaikoQty: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiColor: string;
};

export type JuchuKizaiHonbanbiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiDat: Date;
  mem: string | null;
  juchuHonbanbiAddQty: number | null;
};

/**
 * 機材選択画面で表示する機材の型
 */
export type EqptSelection = {
  kizaiId: number;
  kizaiNam: string;
  shozokuNam: string;
  bumonId: number;
  kizaiGrpCod: string;
  ctnFlg: boolean;
};

/**
 * 機材明細に渡す選択された機材の型
 */
export type SelectedEqptsValues = {
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  shozokuNam: string;
  kizaiGrpCod: string;
  dspOrdNum: number;
  regAmt: number;
  // rankAmt: number;
  kizaiQty: number;
  ctnFlg: boolean;
  blnkQty: number;
};
