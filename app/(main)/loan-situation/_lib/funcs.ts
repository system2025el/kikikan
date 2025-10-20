'use server';

import { selectFilteredEqpts } from '@/app/_lib/db/tables/v-kizai-list';

import { LoanEqTableValues } from './types';

/**
 * 機材マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<LoanEqTableValues[]>} 機材マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredEqpts = async (query: string) => {
  try {
    const { data, error } = await selectFilteredEqpts({ q: query, d: null, s: null, b: null });
    console.log(data);

    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredEqpts: LoanEqTableValues[] = data.map((d, index) => ({
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      kizaiQty: d.kizai_qty,
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      bumonNam: d.bumon_nam,
      daibumonNam: d.dai_bumon_nam,
      shukeibumonNam: d.shukei_bumon_nam,
      regAmt: d.reg_amt,
      rankAmt1: d.rank_amt_1,
      rankAmt2: d.rank_amt_2,
      rankAmt3: d.rank_amt_3,
      rankAmt4: d.rank_amt_4,
      rankAmt5: d.rank_amt_5,
      dspFlg: Boolean(d.dsp_flg),
      delFlg: Boolean(d.del_flg),
    }));
    console.log('機材マスタリストを取得した');
    return filteredEqpts;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
