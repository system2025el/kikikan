import { z } from 'zod';

const bumonsMasterSchema = z.object({
  bumonId: z.number(),
  bumonNam: z.string(),
  delFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  mem: z.string().max(200, '200文字以内で入力してくださいTEST。').optional(),
  daibumonId: z.number().optional(),
  shukeibumonId: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const BumonsMasterTableSchema = bumonsMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export type BumonsMasterTableValues = z.infer<typeof BumonsMasterTableSchema>;

export const BumonsMasterDialogSchema = z.object({
  bumonId: z.number().optional(),
  bumonNam: z.string(),
  delFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  mem: z.string().max(200, '200文字以内で入力してくださいTEST。').optional(),
  daibumonId: z.number().optional(),
  shukeibumonId: z.number().optional(),
});

export type BumonsMasterDialogValues = z.infer<typeof BumonsMasterDialogSchema>;
