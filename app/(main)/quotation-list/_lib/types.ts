import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

/**
 * 見積一覧表示テーブルのタイプ
 */
export type QuotTableValues = {
  mituHeadId: number;
  juchuHeadId: number;
  mituStsNam: string;
  mituHeadNam: string;
  koenNam: string;
  kokyakuNam: string;
  mituDat: string;
  nyuryokuUser: string;
};

/**
 * 見積一覧検索のタイプ
 */
export type QuotSearchValues = {
  mituId: number | null;
  juchuId: number | null;
  mituSts: number | null;
  mituHeadNam: string | null;
  kokyaku: string | null;
  mituDat: { strt: Date | null; end: Date | null };
  nyuryokuUser: string | null;
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
 * 見積明細ヘッドのzodSchema
 */
export const quotMeisaiHeadSchema = z.object({
  mituMeisaiHeadId: z.number().int().nullish(),
  mituMeisaiHeadNam: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullish(),
  mituMeisaiKbn: z.number(),
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
});

/**
 * 明細ヘッドのタイプ
 */
export type QuotMeisaiHeadValues = z.infer<typeof quotMeisaiHeadSchema>;

/**
 * 明細書全体のzodSchema
 */
export const QuotHeadSchema = z.object({
  mituHeadId: z.number().nullish(),
  juchuHeadId: z.number().nullish(),
  mituSts: z.number().nullish(),
  mituDat: z.date().nullish(),
  mituHeadNam: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullish(),
  kokyaku: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullish(),
  nyuryokuUser: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  mituRange: z.object({
    strt: z.date().nullish(),
    end: z.date().nullish(),
  }),
  kokyakuTantoNam: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  koenNam: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullish(),
  koenbashoNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
  mituHonbanbiQty: z
    .number()
    .max(99, { message: validationMessages.maxNumberLength(2) })
    .nullish(),
  biko: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
  comment: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .nullish(),
  kizaiChukeiMei: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  kizaiChukeiAmt: z.number().nullish(),
  chukeiMei: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  chukeiAmt: z.number().nullish(),
  tokuNebikiMei: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  tokuNebikiAmt: z
    .number({ message: validationMessages.number() })
    .max(999999999, { message: validationMessages.maxNumberLength(9) })
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
  gokeiMei: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  gokeiAmt: z.number({ message: validationMessages.number() }).nullish(),
  meisaiHeads: z
    .object({
      kizai: z.array(quotMeisaiHeadSchema).nullish(),
      labor: z.array(quotMeisaiHeadSchema).nullish(),
      other: z.array(quotMeisaiHeadSchema).nullish(),
    })
    .nullish(),
});

/**
 * 明細書全体のタイプ
 */
export type QuotHeadValues = z.infer<typeof QuotHeadSchema>;
