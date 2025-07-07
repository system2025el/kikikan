import { z } from 'zod';

const basesMasterSchema = z.object({
  kyotenId: z.number().optional(),
  kyotenNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const BasesMasterTableSchema = basesMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export type BasesMasterTableValues = z.infer<typeof BasesMasterTableSchema>;

export const BasesMasterDialogSchema = basesMasterSchema.omit({
  //DB   kyotenId: true,
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
  dspFlg: true,
});

export type BasesMasterDialogValues = z.infer<typeof BasesMasterDialogSchema>;

// export type BasesMasterValues = { kyotenId: number; kyotenNam: string; dspOrdNum: number };
