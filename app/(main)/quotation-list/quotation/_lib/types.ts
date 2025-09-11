import z from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';
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
  mituMeisaiHeadNam: z.string().max(50).nullish(),
  headNamDspFlg: z.boolean(),
  meisai: z
    .array(
      z.object({
        nam: z.string().max(50).nullish(),
        qty: z
          .string()
          .regex(/^[0-9]+$/)
          .max(4, { message: validationMessages.maxNumberLength(4) })
          .nullish(),
        honbanbiQty: z
          .string()
          .regex(/^[0-9]+$/)
          .max(3, { message: validationMessages.maxNumberLength(3) })
          .nullish(),
        tankaAmt: z
          .string()
          .regex(/^[0-9]+$/)
          .max(9, { message: validationMessages.maxNumberLength(9) })
          .nullish(),
        shokeiAmt: z
          .string()
          .regex(/^[0-9]+$/)
          .max(12, { message: validationMessages.maxNumberLength(12) })
          .nullish(),
      })
    )
    .nullish(),
});

/**
 * 明細ヘッドのタイプ
 */
export type QuotMaisaiHeadValues = z.infer<typeof quotMeisaiHeadSchema>;

/**
 * 明細書全体のzodSchema
 */
export const QuotHeadSchema = z.object({
  mituHeadId: z.number().nullish(),
  juchuHeadId: z.number().nullish(),
  mituSts: z.number().nullish(),
  mituDat: z.date().nullish(),
  mituHeadNam: z.string().max(50).nullish(),
  kokyaku: z.string().max(50).nullish(),
  nyuryokuUser: z.object({
    id: z.string().max(20).nullish(),
    name: z.string().max(20).nullish(),
  }),
  mituRange: z.object({
    strt: z.date().nullish(),
    end: z.date().nullish(),
  }),
  kokyakuTantoNam: z.string().max(20).nullish(),
  koenNam: z.string().max(50).nullish(),
  koenbashoNam: z.string().max(100).nullish(),
  mituHonbanbiQty: z
    .string()
    .regex(/^[0-9]+$/)
    .max(2, { message: validationMessages.maxNumberLength(2) })
    .nullish(),
  biko: z.string().max(100).nullish(),
  meisaiHeads: z
    .object({
      kizai: z.array(quotMeisaiHeadSchema),
      labor: z.array(quotMeisaiHeadSchema),
      other: z.array(quotMeisaiHeadSchema),
    })
    .nullish(),
  comment: z.string().max(100).nullish(),
  chukeiMei: z.string().max(10).nullish(),
  tokuNebikiMei: z.string().max(10).nullish(),
  tokuNebikiAmt: z
    .string()
    .regex(/^[0-9]+$/)
    .max(9, { message: validationMessages.maxNumberLength(9) })
    .nullish(),
  zeiAmt: z
    .string()
    .regex(/^[0-9]+$/)
    .max(12, { message: validationMessages.maxNumberLength(12) })
    .nullish(),
});

/**
 * 明細書全体のタイプ
 */
export type QuotHeadValues = z.infer<typeof QuotHeadSchema>;
