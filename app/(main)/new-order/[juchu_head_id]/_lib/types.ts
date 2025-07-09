import { z } from 'zod';

export const JuchuHeadSchema = z.object({
  juchuHeadId: z.number().optional(),
  delFlg: z.boolean().optional(),
  juchuSts: z.number().optional(),
  juchuDat: z.date().optional(),
  juchuStrDat: z.date().optional(),
  juchuEndDat: z.date().optional(),
  nyuryokuUser: z.string().optional(),
  koenNam: z.string().optional(),
  koenbashoNam: z.string().optional(),
  kokyakuId: z.number().optional(),
  kokyakuTantoNam: z.string().optional(),
  mem: z.string().optional(),
  nebikiAmt: z.number().optional(),
  addDat: z.date().optional(),
  addUser: z.string().optional(),
  updDat: z.date().optional(),
  updUser: z.string().optional(),
});

export type JuchuHeadValues = z.infer<typeof JuchuHeadSchema>;

export const NewOrderSchema = z.object({
  juchuHeadId: z.number().optional(),
  delFlg: z.boolean().optional(),
  juchuSts: z.number().optional(),
  juchuDat: z.date().optional(),
  juchuStrDat: z.date().optional(),
  juchuEndDat: z.date().optional(),
  nyuryokuUser: z.string().optional(),
  koenNam: z.string().optional(),
  koenbashoNam: z.string().optional(),
  kokyakuId: z.number().optional(),
  kokyakuTantoNam: z.string().optional(),
  mem: z.string().optional(),
  nebikiAmt: z.number().optional(),
});

export type NewOrderValues = z.infer<typeof NewOrderSchema>;
