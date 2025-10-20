import { number, z } from 'zod';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';

// Schema
export const EqptsMasterDialogSchema = z.object({
  kizaiNam: z
    .string()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .min(1, { message: validationMessages.required() }),
  sectionNum: z.number().nullable(),
  elNum: z.number().nullable(),
  delFlg: z.boolean().optional(),
  shozokuId: z.number({ message: '選択してください' }).min(1, { message: '選択してください' }),
  bldCod: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  tanaCod: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  edaCod: z
    .string()
    .max(20, { message: validationMessages.maxStringLength(20) })
    .nullish(),
  kizaiGrpCod: z
    .string()
    .max(10, { message: validationMessages.maxStringLength(10) })
    .nullish(),
  dspOrdNum: z.number().nullable(),
  mem: z
    .string()
    .max(200, { message: validationMessages.maxStringLength(200) })
    .nullish(),
  bumonId: z
    .number()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .optional(),
  shukeibumonId: z
    .number()
    .max(100, { message: validationMessages.maxStringLength(100) })
    .optional(),
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
  ngQty: number | null;
  yukoQty: number | null;
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
