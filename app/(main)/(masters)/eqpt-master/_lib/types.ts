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
  kizaiQty: z.number(),
  delFlg: z.boolean().optional(),
  shozokuNam: z.string().optional(),
  bldCod: z.string().optional(),
  tanaCod: z.string().optional(),
  edaCod: z.string().optional(),
  kizaiGrpCod: z.string().optional(),
  dspOrdNum: z.number().optional(),
  mem: z.string().optional(),
  bumonNam: z.string().optional(),
  shukeibumonNam: z.string().optional(),
  dspFlg: z.boolean().optional(),
  ctnFlg: z.boolean().optional(),
  defDatQty: z.number().optional(),
  regAmt: z.number(),
  rankAmt1: z.number().optional(),
  rankAmt2: z.number().optional(),
  rankAmt3: z.number().optional(),
  rankAmt4: z.number().optional(),
  rankAmt5: z.number().optional(),
  sectionNum: z.number().optional(),
  elNum: z.number(),
  addDat: z.date(),
  addUser: z.string(),
  updDat: z.date(),
  updUser: z.string(),
});
const EqptMasterTableSchema = z.object({
  kizaiId: z.number(),
  kizaiNam: z.string(),
  kizaiQty: z.number(),
  delFlg: z.boolean().optional(),
  shozokuNam: z.string().optional(),
  mem: z.string().optional(),
  bumonNam: z.string().optional(),
  daibumonNam: z.string(),
  shukeibumonNam: z.string().optional(),
  regAmt: z.number(),
  rankAmt1: z.number().optional(),
  rankAmt2: z.number().optional(),
  rankAmt3: z.number().optional(),
  rankAmt4: z.number().optional(),
  rankAmt5: z.number().optional(),
});

export const EqptMasterDialogSchema = eqptMasterSchema.omit({
  addDat: true,
  addUser: true,
  updDat: true,
  updUser: true,
});

export type EqptMasterTableValues = z.infer<typeof EqptMasterTableSchema>;
export type EqptMasterDialogValues = z.infer<typeof EqptMasterDialogSchema>;
// 検索用
export const EqptMasterSearchSchema = EqptMasterDialogSchema.omit({
  delFlg: true,
  shozokuNam: true,
  bldCod: true,
  tanaCod: true,
  edaCod: true,
  kizaiGrpCod: true,
  dspOrdNum: true,
  mem: true,
  bumonNam: true,
  shukeibumonNam: true,
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
