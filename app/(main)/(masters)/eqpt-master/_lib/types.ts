import { number, z } from 'zod';

export type EqptMasterData = {
  id: number;
  name: string;
  quantity: number;
  bumon: string;
  daiBumon: string;
  shuukeibumon: string;
  isshiki: string;
  serialnumber: number;
  price1: number;
  price2: number;
  price3: number;
  price4: number;
  price5: number;
  memo: string;
};

// 全機材Schema
const eqptMasterSchema = z.object({
  kizaiId: z.number().optional(),
  kizaiNam: z.string(),
  delFlg: z.boolean().optional(),
  shozokuId: z.number().optional(),
  bldCod: z.string().optional(),
  tanaCod: z.string().optional(),
  edaCod: z.string().optional(),
  kizaiGrpCod: z.string().optional(),
  dspOrdNum: z.number().optional(),
  mem: z.string().optional(),
  bumonId: z.number().optional(),
  shukeibumonId: z.number().optional(),
  dspFlg: z.boolean().optional(),
  ctnFlg: z.boolean().optional(),
  defDatQty: z.number().optional(),
  regAmt: z.number(),
  rankAmt1: z.number().optional(),
  rankAmt2: z.number().optional(),
  rankAmt3: z.number().optional(),
  rankAmt4: z.number().optional(),
  rankAmt5: z.number().optional(),
  sectionNum: z.number(),
  elNum: z.number(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});
const eqptMasterTableSchema = z.object({
  kizaiId: z.number(),
  kizaiNam: z.string(),
  delFlg: z.boolean().optional(),
  shozokuId: z.number().optional(),
  bldCod: z.string().optional(),
  tanaCod: z.string().optional(),
  edaCod: z.string().optional(),
  kizaiGrpCod: z.string().optional(),
  dspOrdNum: z.number().optional(),
  mem: z.string().optional(),
  bumonId: z.number().optional(),
  shukeibumonId: z.number().optional(),
  dspFlg: z.boolean().optional(),
  ctnFlg: z.boolean().optional(),
  defDatQty: z.number().optional(),
  regAmt: z.number(),
  rankAmt1: z.number().optional(),
  rankAmt2: z.number().optional(),
  rankAmt3: z.number().optional(),
  rankAmt4: z.number().optional(),
  rankAmt5: z.number().optional(),
  sectionNum: z.number(),
  elNum: z.number(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});

export const EqptMasterDialogSchema = eqptMasterSchema.omit({
  sectionNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export const EqptMasterTableSchema = eqptMasterTableSchema.omit({
  sectionNum: true,
  elNum: true,
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export type eqptMasterTableValues = z.infer<typeof eqptMasterTableSchema>;
export type EqptMasterDialogValues = z.infer<typeof EqptMasterDialogSchema>;
// 検索用
export const EqptMasterSearchSchema = EqptMasterDialogSchema.omit({
  delFlg: true,
  shozokuId: true,
  bldCod: true,
  tanaCod: true,
  edaCod: true,
  kizaiGrpCod: true,
  dspOrdNum: true,
  mem: true,
  bumonId: true,
  shukeibumonId: true,
  dspFlg: true,
  ctnFlg: true,
  defDatQty: true,
  regAmt: true,
  rankAmt1: true,
  rankAmt2: true,
  rankAmt3: true,
  rankAmt4: true,
  rankAmt5: true,
});
export type EqptMasterSearchValues = z.infer<typeof EqptMasterSearchSchema>;
