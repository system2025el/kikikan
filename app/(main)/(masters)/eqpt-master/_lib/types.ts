import { strict } from 'assert';
import { number, z } from 'zod';

// Schema
export const EqptsMasterDialogSchema = z.object({
  kizaiNam: z.string().max(100, { message: '100文字以内で入力してください' }).min(1, { message: '必須項目です' }),
  sectionNum: z.number().nullable(),
  elNum: z.number().nullable(),
  delFlg: z.boolean().optional(),
  shozokuId: z.number({ message: '選択してください' }).min(1, { message: '選択してください' }),
  bldCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  tanaCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  edaCod: z.string().max(20, { message: '20文字以内で入力してください' }).optional().nullable(),
  kizaiGrpCod: z.string().max(10, { message: '10文字以内で入力してください' }).optional().nullable(),
  dspOrdNum: z.number().nullable(),
  mem: z.string().max(200, { message: '200文字以内で入力してください' }).optional().nullable(),
  bumonId: z.number().max(100, { message: '100文字以内で入力してください' }).optional(),
  shukeibumonId: z.number().max(100, { message: '100文字以内で入力してください' }).optional(),
  dspFlg: z.boolean().optional(),
  ctnFlg: z.boolean().optional(),
  defDatQty: z.number().nullable(),
  regAmt: z.number({ message: '定価を入力してください' }).min(1, { message: '定価を入力してください' }),
  rankAmt1: z.number().nullable(),
  rankAmt2: z.number().nullable(),
  rankAmt3: z.number().nullable(),
  rankAmt4: z.number().nullable(),
  rankAmt5: z.number().nullable(),
});

type eqptsMasterDialogValues = z.infer<typeof EqptsMasterDialogSchema>;
export type EqptsMasterDialogValues = eqptsMasterDialogValues & {
  addUser?: string | null;
  addDat?: string | null;
  updUser?: string | null;
  updDat?: string | null;
};

export type EqptsMasterTableValues = {
  kizaiId: number;
  kizaiNam: string | null;
  kizaiQty: number | null;
  bumonNam: string | null;
  daibumonNam: string | null;
  delFlg: boolean | null;
  dspFlg: boolean | null;
  mem: string | null;
  rankAmt1: number | null;
  rankAmt2: number | null;
  rankAmt3: number | null;
  rankAmt4: number | null;
  rankAmt5: number | null;
  regAmt: number | null;
  shozokuNam: string | null;
  shukeibumonNam: string | null;
  tblDspId: number;
};
//{
//   kizaiId: number | null;
//   kizaiNam: string;
//   kizaiQty: number;
//   shozokuNam: string;
//   mem: string;
//   bumonNam: string;
//   daibumonNam: string;
//   shukeibumonNam: string;
//   regAmt: number | null;
//   rankAmt1: number | null;
//   rankAmt2: number | null;
//   rankAmt3: number | null;
//   rankAmt4: number | null;
//   rankAmt5: number | null;
//   dspFlg: boolean;
//   tblDspId: number;
//   delFlg: boolean;
// };

/**
 * 機材選択ん使うタイプ
 */
export type SelectedEqptsValues = {
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  shozokuNam: string;
  kizaiGrpCod: string;
  dspOrdNum: number;
  regAmt: number;
  rankAmt: number;
  kizaiQty: number;
};
