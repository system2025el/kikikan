'use server';

import { selectFilteredJuchusForBill } from '@/app/_lib/db/tables/v-seikyu-date-lst';

import { BillMeisaiHeadsValues } from '../../_lib/types';

export const getJuchusForBill = async (queries: {
  kokyakuId: number;
  date: string;
  flg: boolean;
}): Promise<BillMeisaiHeadsValues[]> => {
  console.log(queries);
  const { kokyakuId, date, flg } = queries;
  try {
    if (flg) {
      // 詳細表示するとき
      return [];
    } else {
      // 明細をまとめて表示するとき
      const juchus = await selectFilteredJuchusForBill({ kokyakuId: kokyakuId, date: date });
      if (!juchus) {
        throw new Error('DB取得エラー');
      }
      if (!juchus.rows || juchus.rows.length === 0) {
        return [];
      }
      console.log('受注情報', juchus.rows);
      return juchus.rows.map((j) => ({
        juchuHeadId: j.juchu_head_id,
        juchuKizaiHeadId: j.juchu_kizai_head_id,
        koenNam: j.koen_nam,
        seikyuRange: {
          strt: j.seikyu_dat ? new Date(j.seikyu_dat) : new Date(j.shuko_dat),
          end: new Date(j.nyuko_dat) > new Date(date) ? new Date(date) : new Date(j.nyuko_dat),
        },
        koenBashoNam: j.koenbasho_nam,
        kokyakuTantoNam: j.kokyaku_tanto_nam,
        zeiFlg: false,
        meisai: Array.isArray(juchus.rows)
          ? juchus.rows.filter(
              (m) =>
                m.juchu_head_id === j.juchu_head_id && m.juchu_kizai_head_id === j.juchu_kizai_head_id && m.shokei_amt
            ).length === 0
            ? []
            : juchus.rows
                .filter(
                  (m) =>
                    m.juchu_head_id === j.juchu_head_id &&
                    m.juchu_kizai_head_id === j.juchu_kizai_head_id &&
                    m.shokei_amt
                )
                .map((m) => ({
                  nam: `${m.head_nam}一式`,
                  qty: 1,
                  honbanbiQty: m.honbanbi_qty + m.add_dat_qty,
                  tankaAmt: m.shokei_amt,
                  shokeiAmt: 1 * (m.honbanbi_qty + m.add_dat_qty) * m.shokei_amt,
                  ...m,
                }))
          : [],
      }));
    }
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};
