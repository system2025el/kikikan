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

export const NewOrderSchema = z.object({
  juchuHeadId: z.number(),
  delFlg: z.number().nullable(),
  juchuSts: z.number().nullable(),
  juchuDat: z.date({ message: '受注日は必須です' }),
  juchuRange: z.tuple([z.date(), z.date()]).nullable(),
  nyuryokuUser: z.string(),
  koenNam: z.string({ message: '公演名は必須です' }).min(1, { message: '公演名は必須です' }),
  koenbashoNam: z.string().nullable(),
  kokyaku: z.object({ kokyakuId: z.number(), kokyakuNam: z.string().min(1, { message: '公演名は必須です' }) }),
  kokyakuTantoNam: z.string().nullable(),
  mem: z.string().nullable(),
  nebikiAmt: z.number().nullable(),
  zeiKbn: z.number().nullable(),
});

export type NewOrderValues = z.infer<typeof NewOrderSchema>;
