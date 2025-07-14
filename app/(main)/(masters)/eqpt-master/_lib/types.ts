import { number, z } from 'zod';

// Schema
export const EqptMasterDialogSchema = z.object({
  kizaiNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  kizaiQty: z.number({ message: '数字を入力してください' }),
  sectionNum: z.number({ message: '数字を入力してください' }).optional(),
  elNum: z.number({ message: '数字を入力してください' }).optional(),
  delFlg: z.boolean().optional(),
  shozokuNam: z.string({ message: '選択してください' }).optional(),
  bldCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  tanaCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  edaCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  kizaiGrpCod: z.string().max(10, { message: '10文字以内で入力してください' }).optional(),
  dspOrdNum: z.number({ message: '数字を入力してください' }).optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
  bumonNam: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  shukeibumonNam: z.string().max(100, { message: '100文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
  ctnFlg: z.boolean().optional(),
  defDatQty: z.number({ message: '数字を入力してください' }).optional(),
  regAmt: z.number({ message: '数字を入力してください' }),
  rankAmt1: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt2: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt3: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt4: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt5: z.number({ message: '数字を入力してください' }).optional(),
});

export type EqptMasterDialogValues = z.infer<typeof EqptMasterDialogSchema>;

export type EqptMasterTableValues = {
  kizaiId: number;
  kizaiNam: string;
  kizaiQty: number;
  shozokuNam: string;
  mem: string;
  bumonNam: string;
  daibumonNam: string;
  shukeibumonNam: string;
  regAmt: number;
  rankAmt1: number;
  rankAmt2: number;
  rankAmt3: number;
  rankAmt4: number;
  rankAmt5: number;
  dspFlg: boolean;
};

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
