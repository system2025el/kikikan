import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

/**
 * 見積一覧表示テーブルのタイプ
 */
export type BillTableValues = {
  seikyuHeadId: number;
  juchuHeadId: number;
  seikyuStsNam: string;
  seikyuHeadNam: string;
  koenNam: string;
  kokyakuNam: string;
  seikyuDat: string;
  nyuryokuUser: string;
};

/**
 * 見積書画面に表示する受注のタイプ
 */
export type JuchuValues = {
  juchuHeadId: number | undefined | null;
  delFlg?: number;
  juchuSts: string | undefined | null;
  juchuDat: Date | undefined | null;
  juchuRange: { strt: Date | undefined | null; end: Date | undefined | null };
  nyuryokuUser: string | undefined | null;
  koenNam: string | undefined | null;
  koenbashoNam: string | undefined | null;
  kokyaku: { id: number | undefined | null; name: string | undefined | null };
  kokyakuTantoNam: string | undefined | null;
  mem: string | undefined | null;
  nebikiAmt: number | undefined | null;
  zeiKbn?: string | undefined | null;
};

/**
 * 明細書全体のzodSchema
 */
export const BillHeadSchema = z.object({
  seikyuHeadId: z.number().nullish(),
  seikyuSts: z.number().nullish(),
  seikyuDat: z.date().nullish(),
  aite: z.string().max(50, { message: validationMessages.maxStringLength(50) }),
  seikyuHeadNam: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullish(),
  kokyaku: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullish(),
  adr1: z
    .string()
    .max(8, { message: validationMessages.maxStringLength(8) })
    .nullish(),
  adr2: z.object({
    shozai: z
      .string()
      .max(50, { message: validationMessages.maxStringLength(50) })
      .nullish(),
    tatemono: z
      .string()
      .max(50, { message: validationMessages.maxStringLength(50) })
      .nullish(),
    sonota: z
      .string()
      .max(50, { message: validationMessages.maxStringLength(50) })
      .nullish(),
  }),
  nyuryokuUser: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  kizaiChukeiAmt: z.number().nullish(),
  chukeiAmt: z.number().nullish(),
  tokuNebikiMei: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  preTaxGokeiAmt: z.number().nullish(),
  zeiAmt: z
    .number({ message: validationMessages.number() })
    .max(999999999999, { message: validationMessages.maxNumberLength(12) })
    .nullish(),
  zeiRat: z
    .number({ message: validationMessages.number() })
    .max(999, { message: validationMessages.maxNumberLength(3) })
    .nullish(),
  gokeiAmt: z.number({ message: validationMessages.number() }).nullish(),
  meisaiHeads: z
    .array(
      z.object({
        seikyuMeisaiHeadId: z.number().int().nullish(),
        seikyuMeisaiHeadNam: z
          .string()
          .max(50, { message: validationMessages.maxStringLength(50) })
          .nullish(),
        seikyuMeisaiKbn: z.number(),
        headNamDspFlg: z.boolean(),
        nebikiNam: z.string().nullish(),
        nebikiAmt: z
          .number()
          .max(999999999, { message: validationMessages.maxNumberLength(9) })
          .nullish(),
        nebikiAftNam: z.string().nullish(),
        shokeiMei: z.string().nullish(),
        shokeiAmt: z
          .number({ message: validationMessages.number() })
          .max(999999999999, { message: validationMessages.maxNumberLength(12) })
          .nullish(),
        nebikiAftAmt: z
          .number()
          .max(999999999, { message: validationMessages.maxNumberLength(9) })
          .nullish(),
        biko1: z
          .string()
          .max(100, { message: validationMessages.maxStringLength(100) })
          .nullish(),
        biko2: z
          .string()
          .max(100, { message: validationMessages.maxStringLength(100) })
          .nullish(),
        biko3: z
          .string()
          .max(100, { message: validationMessages.maxStringLength(100) })
          .nullish(),
        meisai: z
          .array(
            z.object({
              id: z.number().nullish(),
              nam: z
                .string()
                .max(50, { message: validationMessages.maxStringLength(50) })
                .nullish(),
              qty: z
                .number({ message: validationMessages.number() })
                .max(9999, { message: validationMessages.maxNumberLength(4) })
                .nullish(),
              honbanbiQty: z
                .number({ message: validationMessages.number() })
                .max(999, { message: validationMessages.maxNumberLength(3) })
                .nullish(),
              tankaAmt: z
                .number({ message: validationMessages.number() })
                .max(999999999, { message: validationMessages.maxNumberLength(9) })
                .nullish(),
              shokeiAmt: z
                .number({ message: validationMessages.number() })
                .max(999999999999, { message: validationMessages.maxNumberLength(12) })
                .nullish(),
            })
          )
          .nullish(),
      })
    )
    .nullish(),
});

/**
 * 明細書全体のタイプ
 */
export type BillHeadValues = z.infer<typeof BillHeadSchema>;

export type BillSearchValues = {
  billId: number | null | undefined;
  billingSts: number | null | undefined;
  range: { str: Date | null | undefined; end: Date | null | undefined };
  kokyaku: string | null | undefined;
  kokyakuTantoNam: string | null | undefined;
};

export type BillsListTableValues = {
  billHeadId: number;
  billingSts: string | null;
  billHeadNam: string | null;
  kokyaku: string | null;
  seikyuDat: string | null;
};
