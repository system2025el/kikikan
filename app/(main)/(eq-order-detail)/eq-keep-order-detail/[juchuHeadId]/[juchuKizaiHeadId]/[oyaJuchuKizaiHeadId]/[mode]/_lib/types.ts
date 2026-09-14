import z from 'zod';

import { MEMO_MAX_LENGTH } from '@/app/_lib/constants';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';

/** キープ出庫日時がキープ入庫日時より前になっている場合のメッセージ */
const KEEP_ORDER_MESSAGE = 'キープ入庫日時以降にしてください';

export const KeepJuchuKizaiHeadSchema = z
  .object({
    juchuHeadId: z.number(),
    juchuKizaiHeadId: z.number(),
    juchuKizaiHeadKbn: z.number(),
    mem: z
      .string()
      .max(MEMO_MAX_LENGTH, { message: validationMessages.maxStringLength(MEMO_MAX_LENGTH) })
      .nullable(),
    headNam: z
      .string()
      .max(50, { message: validationMessages.maxStringLength(50) })
      .nullable(),
    oyaJuchuKizaiHeadId: z.number(),
    kicsShukoDat: z.date().nullable(),
    kicsNyukoDat: z.date().nullable(),
    yardShukoDat: z.date().nullable(),
    yardNyukoDat: z.date().nullable(),
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => data.kicsNyukoDat || data.yardNyukoDat, {
    message: validationMessages.required(),
    path: ['yardNyukoDat'],
  })
  .refine(
    (data) => {
      if (data.kicsShukoDat && !data.kicsNyukoDat) {
        return false;
      }
      return true;
    },
    {
      message: '',
      path: ['kicsNyukoDat'],
    }
  )
  .refine(
    (data) => {
      if (data.yardShukoDat && !data.yardNyukoDat) {
        return false;
      }
      return true;
    },
    {
      message: '',
      path: ['yardNyukoDat'],
    }
  )
  // キープは親の出庫〜入庫の間で一時的に現場から戻し（キープ入庫）、再度現場へ出す（キープ出庫）
  // ための明細なので、メイン明細とは逆にキープ出庫日時がキープ入庫日時以降でなければならない。
  // 所属（KICS/YARD）ごとの組で比較し、キープ出庫日時が未入力の組は比較しない（任意項目のため）。
  // メイン明細にある全体比較（所属をまたいだ比較）はここでは不要。キープは所属ごとに
  // 「預かって再度出す」が独立した1サイクルであり、上の「出庫があれば同所属の入庫が必須」により
  // 出庫は必ず同所属の入庫と対になる。出庫のない入庫（まだ現場に戻していない状態）は正常なので、
  // 所属をまたいで日付を比較する意味がなく、組比較だけで判定できる。
  .refine((data) => !data.kicsNyukoDat || !data.kicsShukoDat || data.kicsNyukoDat <= data.kicsShukoDat, {
    message: '',
    path: ['kicsNyukoDat'],
  })
  .refine((data) => !data.kicsNyukoDat || !data.kicsShukoDat || data.kicsNyukoDat <= data.kicsShukoDat, {
    message: KEEP_ORDER_MESSAGE,
    path: ['kicsShukoDat'],
  })
  .refine((data) => !data.yardNyukoDat || !data.yardShukoDat || data.yardNyukoDat <= data.yardShukoDat, {
    message: '',
    path: ['yardNyukoDat'],
  })
  .refine((data) => !data.yardNyukoDat || !data.yardShukoDat || data.yardNyukoDat <= data.yardShukoDat, {
    message: KEEP_ORDER_MESSAGE,
    path: ['yardShukoDat'],
  });

export type KeepJuchuKizaiHeadValues = z.infer<typeof KeepJuchuKizaiHeadSchema>;

export type KeepJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  mShozokuId: number;
  shozokuId: number;
  shozokuNam: string;
  mem: string | null;
  mem2: string | null;
  kizaiId: number;
  kizaiNam: string;
  oyaPlanKizaiQty: number;
  oyaPlanYobiQty: number;
  keepQty: number;
  dspOrdNum: number;
  indentNum: number;
  delFlag: boolean;
  saveFlag: boolean;
  selected: boolean;
};

export type KeepJuchuContainerMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  mem: string | null;
  kizaiId: number;
  kizaiNam: string;
  oyaPlanKicsKizaiQty: number;
  oyaPlanYardKizaiQty: number;
  kicsKeepQty: number;
  yardKeepQty: number;
  dspOrdNum: number;
  indentNum: number;
  delFlag: boolean;
  saveFlag: boolean;
  selected: boolean;
};

export type HonbanbiColorValues = {
  colorId: number;
  colorNam: string;
};
