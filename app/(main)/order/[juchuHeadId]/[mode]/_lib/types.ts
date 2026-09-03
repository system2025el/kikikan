import { z } from 'zod';

import { HONBANBI_ADD_QTY_MAX, HONBANBI_ADD_QTY_MAX_DIGITS, MEMO_MAX_LENGTH } from '@/app/_lib/constants';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const KokyakuSchema = z.object({
  kokyakuId: z.number({ message: validationMessages.required() }),
  kokyakuNam: z
    .string({ message: validationMessages.required() })
    .min(1, { message: validationMessages.required() })
    .max(100, { message: validationMessages.maxStringLength(100) }),
  // kokyakuRank: z.number(),
});

export type KokyakuValues = z.infer<typeof KokyakuSchema>;

/**
 * 受注本番日1件分。
 * 追加日数の上限は t_juchu_kizai_honbanbi.juchu_honbanbi_add_qty が numeric(6,3) のため3桁まで。
 */
export const HonbanbiSchema = z.object({
  juchuHonbanbiShubetuId: z.number(),
  juchuHonbanbiDat: z.date(),
  mem: z
    .string()
    .max(MEMO_MAX_LENGTH, { message: validationMessages.maxStringLength(MEMO_MAX_LENGTH) })
    .nullable(),
  juchuHonbanbiAddQty: z
    .number({ message: validationMessages.number() })
    .min(0, { message: validationMessages.number() })
    .max(HONBANBI_ADD_QTY_MAX, { message: validationMessages.maxNumberLength(HONBANBI_ADD_QTY_MAX_DIGITS) })
    .nullable(),
});

export const OrderSchema = z.object({
  juchuHeadId: z.number(),
  delFlg: z.number(),
  juchuSts: z.number(),
  juchuDat: z.date({ message: validationMessages.required() }),
  juchuRange: z.tuple([z.date(), z.date()]).nullable(),
  nyuryokuUser: z.string({ message: validationMessages.required() }).min(1, { message: validationMessages.required() }),
  koenNam: z
    .string({ message: validationMessages.required() })
    .min(1, { message: validationMessages.required() })
    .max(40, { message: validationMessages.maxStringLength(40) }),
  koenbashoNam: z
    .string()
    .max(40, { message: validationMessages.maxStringLength(40) })
    .nullable(),
  kokyaku: KokyakuSchema,
  kokyakuTantoNam: z
    .string()
    .max(16, { message: validationMessages.maxStringLength(16) })
    .nullable(),
  mem: z
    .string()
    .max(MEMO_MAX_LENGTH, { message: validationMessages.maxStringLength(MEMO_MAX_LENGTH) })
    .nullable(),
  // nebikiAmt: z
  //   .number()
  //   .max(9999999999, { message: validationMessages.maxNumberLength(10) })
  //   .int({ message: validationMessages.int() })

  //   .nullable(),
  zeiKbn: z.number(),
  // 本番日。受注ヘッダー単位のテンプレートとして保存し、各受注機材ヘッダーへ展開する
  honbanbiList: z.array(HonbanbiSchema),
});

export type OrderValues = z.infer<typeof OrderSchema>;

export type EqTableValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  headNam: string;
  kicsShukoDat: string | null;
  kicsNyukoDat: string | null;
  yardShukoDat: string | null;
  yardNyukoDat: string | null;
  sikomibi: number | null;
  rihabi: number | null;
  genebi: number | null;
  honbanbi: number | null;
  juchuHonbanbiCalcQty: number | null;
  shokei: number | null;
  nebikiAmt: number | null;
  nebikiRat: number | null;
  oyaJuchuKizaiHeadId: number | null;
  htKbn: number;
  juchuKizaiHeadKbn: number;
  mem: string | null;
  kicsShukoFixFlg: number | null;
  yardShukoFixFlg: number | null;
  kicsNyukoFixFlg: number | null;
  yardNyukoFixFlg: number | null;
};

export type VehicleTableValues = {
  juchuHeadId: number;
  sharyoHeadId: number;
  sharyoHeadNam: string;
  basho: string | null;
  shubetsuId: number;
  shubetuNam: string;
  nyushukoDat: string;
  headMem: string | null;
};

export type CustomersDialogValues = {
  kokyakuId: number;
  kokyakuNam: string;
  // kokyakuRank: number;
  adrShozai: string;
  adrTatemono: string;
  adrSonota: string;
  tel: string;
  fax: string;
  mem: string;
  dspFlg: boolean;
  tblDspId: number;
  delFlg?: boolean;
};

export type LocsDialogValues = {
  adrShozai: string | null;
  adrSonota: string | null;
  adrTatemono: string | null;
  delFlg: boolean | null;
  dspFlg: boolean | null;
  tblDspId: number;
  fax: string | null;
  locId: number;
  locNam: string;
  mem: string | null;
  tel: string | null;
};

/**
 * コピーダイアログ
 * 出庫日・入庫日は年月日のみ（時刻は0:00固定）で1つずつ。コピー先はYARDで作成する
 */
export const CopyDialogSchema = z
  .object({
    juchuHeadid: z.string().optional(),
    headNam: z
      .string()
      .max(50, { message: validationMessages.maxStringLength(50) })
      .nullable(),
    shukoDat: z.date().nullable(),
    nyukoDat: z.date().nullable(),
  })
  .refine((d) => d.shukoDat !== null, { path: ['shukoDat'], message: validationMessages.required() })
  .refine((d) => d.nyukoDat !== null, { path: ['nyukoDat'], message: validationMessages.required() })
  .refine((d) => !d.shukoDat || !d.nyukoDat || d.shukoDat <= d.nyukoDat, {
    path: ['nyukoDat'],
    message: '入庫日は出庫日以降の日付を入力してください',
  });

export type CopyDialogValue = z.infer<typeof CopyDialogSchema>;

export type CopyJuchuKizaiHeadValue = {
  juchuHeadId: number;
  mem: string | null;
  headNam: string | null;
  kicsShukoDat: Date | null;
  kicsNyukoDat: Date | null;
  yardShukoDat: Date | null;
  yardNyukoDat: Date | null;
  juchuKizaiHeadKbn: number;
  juchuKizaiHeadId: number;
  juchuHonbanbiQty: number | null;
  nebikiAmt: number | null;
  nebikiRat: number | null;
};

export type CopyJuchuKizaiHonbanbiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiDat: Date;
  mem: string | null;
  juchuHonbanbiAddQty: number | null;
};

export type CopyJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  mShozokuId: number;
  shozokuId: number;
  mem: string | null;
  mem2: string | null;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  planKizaiQty: number;
  planYobiQty: number;
  planQty: number;
  dspOrdNum: number;
  indentNum: number;
  delFlag: boolean;
  saveFlag: boolean;
};

export type CopyIdoJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  idoDenId: number | null;
  sagyoDenDat: Date | null;
  sagyoSijiId: number | null;
  mShozokuId: number;
  shozokuId: number;
  shozokuNam: string;
  kizaiId: number;
  kizaiNam: string;
  kizaiQty: number;
  planKizaiQty: number;
  planYobiQty: number;
  planQty: number;
  delFlag: boolean;
  saveFlag: boolean;
};

export type CopyJuchuContainerMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  kizaiId: number;
  kizaiNam: string;
  planKicsKizaiQty: number;
  planYardKizaiQty: number;
  planQty: number;
  mem: string | null;
  dspOrdNum: number;
  indentNum: number;
  delFlag: boolean;
  saveFlag: boolean;
};

export type UsersValue = {
  tantouNam: string;
  mailAdr: string;
};

/** 受注添付ファイル（PDF）の1件 */
export type TempuValues = {
  juchuTempuId: number;
  /** 原本ファイル名。Storage上のキーとは別 */
  fileNam: string;
  /** バイト数 */
  fileSiz: number;
  addDat: string | null;
  addUser: string;
};
