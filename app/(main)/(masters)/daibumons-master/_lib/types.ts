import { z } from 'zod';

const daibumonsMasterSchema = z.object({
  daibumonId: z.number().optional(),
  daibumonNam: z.string(),
  delFlg: z.boolean().optional(),
  mem: z.string().optional(),
  dspFlg: z.boolean().optional(),
  dspOrdNum: z.number().optional(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const DaibumonsMasterTableSchema = daibumonsMasterSchema.omit({
  dspOrdNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export type DaibumonsMasterTableValues = z.infer<typeof DaibumonsMasterTableSchema>;

export const DaibumonsMasterDialogSchema = DaibumonsMasterTableSchema.omit({
  //DB   daibumonId: true,
});

export type DaibumonsMasterDialogValues = z.infer<typeof DaibumonsMasterDialogSchema>;

// export type daibumonsMasterValues = { daibumonId: number; daibumonNam: string; dspOrdNum: number };
