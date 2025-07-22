import { number, z } from 'zod';

// Schema
export const EqptsMasterDialogSchema = z.object({
  kizaiNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  sectionNum: z.number({ message: '数字を入力してください' }).optional(),
  elNum: z.number({ message: '数字を入力してください' }).optional(),
  delFlg: z.boolean().optional(),
  shozokuId: z.number({ message: '選択してください' }).min(1, { message: '選択してください' }),
  bldCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  tanaCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  edaCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional(),
  kizaiGrpCod: z.string().max(10, { message: '10文字以内で入力してください' }).optional(),
  dspOrdNum: z.number({ message: '数字を入力してください' }).optional(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional(),
  bumonId: z.number().max(100, { message: '100文字以内で入力してください' }).optional(),
  shukeibumonId: z.number().max(100, { message: '100文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
  ctnFlg: z.boolean().optional(),
  defDatQty: z.number({ message: '数字を入力してください' }).optional(),
  regAmt: z.number({ message: '定価を入力してください' }).min(1, { message: '定価を入力してください' }),
  rankAmt1: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt2: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt3: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt4: z.number({ message: '数字を入力してください' }).optional(),
  rankAmt5: z.number({ message: '数字を入力してください' }).optional(),
});

export type EqptsMasterDialogValues = z.infer<typeof EqptsMasterDialogSchema>;

export type EqptsMasterTableValues = {
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
  dspOrdNum: number;
};
