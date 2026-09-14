import { nullable, z } from 'zod';

import { MEMO_MAX_LENGTH } from '@/app/_lib/constants';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';

/** 入庫日時が出庫日時より前になっている場合のメッセージ（入庫日時側に出す） */
const NYUKO_ORDER_MESSAGE = '出庫日時以降にしてください';
/** 出庫日時が入庫日時より後になっている場合のメッセージ（出庫日時側に出す） */
const SHUKO_ORDER_MESSAGE = '入庫日時以前にしてください';

export const JuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    juchuHonbanbiQty: z.number().nullable(),
    nebikiAmt: z
      .number()
      .max(9999999999, { message: validationMessages.maxNumberLength(10) })
      .nullable(),
    nebikiRat: z
      .number({ message: validationMessages.number() })
      .int({ message: validationMessages.int() })
      .max(999, { message: validationMessages.maxNumberLength(3) })
      .nullable(),
    mem: z
      .string()
      .max(MEMO_MAX_LENGTH, { message: validationMessages.maxStringLength(MEMO_MAX_LENGTH) })
      .nullable(),
    headNam: z
      .string()
      .max(50, { message: validationMessages.maxStringLength(50) })
      .nullable(),
    kicsShukoDat: z.date().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardShukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: '',
    path: ['kicsShukoDat'],
  })
  .refine((data) => data.kicsShukoDat || data.yardShukoDat, {
    message: validationMessages.required(),
    path: ['yardShukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: validationMessages.required(),
    path: ['yardNyukoDat'],
  })
  // 入庫日時は出庫日時以降でなければならない。所属（KICS/YARD）ごとの組で比較する。
  // KICS出庫→YARD入庫のように所属をまたぐ運用があるため、片方しか入力されていない組は比較しない。
  .refine((data) => !data.kicsShukoDat || !data.kicsNyukoDat || data.kicsShukoDat <= data.kicsNyukoDat, {
    message: '',
    path: ['kicsShukoDat'],
  })
  .refine((data) => !data.kicsShukoDat || !data.kicsNyukoDat || data.kicsShukoDat <= data.kicsNyukoDat, {
    message: NYUKO_ORDER_MESSAGE,
    path: ['kicsNyukoDat'],
  })
  .refine((data) => !data.yardShukoDat || !data.yardNyukoDat || data.yardShukoDat <= data.yardNyukoDat, {
    message: '',
    path: ['yardShukoDat'],
  })
  .refine((data) => !data.yardShukoDat || !data.yardNyukoDat || data.yardShukoDat <= data.yardNyukoDat, {
    message: NYUKO_ORDER_MESSAGE,
    path: ['yardNyukoDat'],
  })
  // 組が噛み合わない入力（KICS出庫のみ・YARD入庫のみ等）は上の組比較をすり抜けるため、
  // 所属をまたいでも「すべての出庫日時 <= すべての入庫日時」が成り立つことを確認する。
  // 両方の組が揃っている場合は組比較に吸収されるので、実際に効くのは片方の組が欠けているとき。
  // 逆転を許すと、出庫前に入庫する伝票が作られたり、getRange() が空配列になって
  // 使用日カレンダー（t_juchu_kizai_honbanbi の種別1）が1件も作られず在庫を消費しないデータになる。
  .superRefine((data, ctx) => {
    const shukoList: { key: 'kicsShukoDat' | 'yardShukoDat'; dat: Date }[] = [];
    if (data.kicsShukoDat) shukoList.push({ key: 'kicsShukoDat', dat: data.kicsShukoDat });
    if (data.yardShukoDat) shukoList.push({ key: 'yardShukoDat', dat: data.yardShukoDat });

    const nyukoList: { key: 'kicsNyukoDat' | 'yardNyukoDat'; dat: Date }[] = [];
    if (data.kicsNyukoDat) nyukoList.push({ key: 'kicsNyukoDat', dat: data.kicsNyukoDat });
    if (data.yardNyukoDat) nyukoList.push({ key: 'yardNyukoDat', dat: data.yardNyukoDat });

    if (shukoList.length === 0 || nyukoList.length === 0) return;

    // 最早の出庫日時・最遅の入庫日時（date-funcs.ts の getShukoDate/getNyukoDate と同じ採り方）
    const firstShuko = shukoList.reduce((a, b) => (a.dat <= b.dat ? a : b));
    const lastNyuko = nyukoList.reduce((a, b) => (a.dat >= b.dat ? a : b));

    // 最早の出庫日時より前の入庫日時は、出庫する前に戻ってくることになる
    for (const nyuko of nyukoList.filter((d) => d.dat < firstShuko.dat)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '', path: [firstShuko.key] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: NYUKO_ORDER_MESSAGE, path: [nyuko.key] });
    }

    // 最遅の入庫日時より後の出庫日時は、すべて戻ってきた後に出ていくことになる
    for (const shuko of shukoList.filter((d) => d.dat > lastNyuko.dat)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: '', path: [lastNyuko.key] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: SHUKO_ORDER_MESSAGE, path: [shuko.key] });
    }
  });

export type JuchuKizaiHeadValues = z.infer<typeof JuchuKizaiHeadSchema>;

export type JuchuKizaiMeisaiValues = {
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
  selected: boolean;
};

export type IdoJuchuKizaiMeisaiValues = {
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

export type JuchuContainerMeisaiValues = {
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
  selected: boolean;
};

export type StockTableValues = {
  calDat: Date;
  kizaiId: number;
  kizaiQty: number;
  juchuQty: number;
  zaikoQty: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiColor: string;
};

export type JuchuKizaiHonbanbiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuHonbanbiShubetuId: number;
  juchuHonbanbiDat: Date;
  mem: string | null;
  juchuHonbanbiAddQty: number | null;
};

/**
 * 機材選択画面で表示する機材の型
 */
export type EqptSelection = {
  kizaiId: number;
  kizaiNam: string;
  shozokuNam: string;
  bumonId: number;
  kizaiGrpCod: string;
  ctnFlg: boolean;
};

/**
 * 機材明細に渡す選択された機材の型
 */
export type SelectedEqptsValues = {
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  shozokuNam: string;
  kizaiGrpCod: string;
  dspOrdNum: number;
  regAmt: number;
  // rankAmt: number;
  kizaiQty: number;
  ctnFlg: boolean;
  indentNum: number;
};

export const DialogSchema = z.object({
  headNam: z
    .string()
    .max(50, { message: validationMessages.maxStringLength(50) })
    .nullable(),
});

export type DialogValues = z.infer<typeof DialogSchema>;

/**
 * 分離用機材type
 */
export type SeparationEq = JuchuKizaiMeisaiValues & {
  separatePlanKizaiQty: number;
  separatePlanYobiQty: number;
};

/**
 * 分離用コンテナtype
 */
export type SeparationCtn = JuchuContainerMeisaiValues & {
  separatePlanKicsKizaiQty: number;
  separatePlanYardKizaiQty: number;
};

/**
 * 機材選択用セット機材グループ
 */
export type EqptGroup = {
  parent: SelectedEqptsValues;
  children: SelectedEqptsValues[];
};
