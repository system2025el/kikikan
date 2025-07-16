import { z } from 'zod';

export const JuchuHeadSchema = z.object({
  juchuHeadId: z.number().optional(),
  delFlg: z.boolean().optional(),
  juchuSts: z.number().optional(),
  juchuDat: z.date().nullable(),
  juchuStrDat: z.date().nullable(),
  juchuEndDat: z.date().nullable(),
  nyuryokuUser: z.string().optional(),
  koenNam: z.string().optional(),
  koenbashoNam: z.string().optional(),
  kokyakuId: z.number().optional(),
  kokyakuTantoNam: z.string().optional(),
  mem: z.string().optional(),
  nebikiAmt: z.number().optional(),
  zeiKbn: z.number().optional(),
  addDat: z.date().optional(),
  addUser: z.string().optional(),
  updDat: z.date().optional(),
  updUser: z.string().optional(),
});

export type JuchuHeadValues = z.infer<typeof JuchuHeadSchema>;

export const KokyakuSchema = z.object({
  kokyakuId: z.number({ message: '相手は必須です' }),
  kokyakuNam: z.string({ message: '相手は必須です' }).min(1, { message: '相手は必須です' }),
});

export type KokyakuValues = z.infer<typeof KokyakuSchema>;

export const NewOrderSchema = z.object({
  juchuHeadId: z.number(),
  delFlg: z.number().nullable(),
  juchuSts: z.number().nullable(),
  juchuDat: z.date({ message: '受注日は必須です' }),
  juchuRange: z.tuple([z.date(), z.date()]).nullable(),
  nyuryokuUser: z.string({ message: '入力者は必須です' }).min(1, { message: '入力者は必須です' }),
  koenNam: z.string({ message: '公演名は必須です' }).min(1, { message: '公演名は必須です' }),
  koenbashoNam: z.string().nullable(),
  kokyaku: KokyakuSchema,
  kokyakuTantoNam: z.string().nullable(),
  mem: z.string().nullable(),
  nebikiAmt: z.number().nullable(),
  zeiKbn: z.number().nullable(),
});

export type NewOrderValues = z.infer<typeof NewOrderSchema>;

export const LockSchema = z.object({
  lockShubetu: z.number(),
  headId: z.number().nullable(),
  addDat: z.date().nullable(),
  addUser: z.string().nullable(),
});

export type LockValues = z.infer<typeof LockSchema>;
