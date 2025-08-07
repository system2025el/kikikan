'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';
import { EqptSelection } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_ui/equipment-selection-dailog';

import { getAllBumonSelections, getAllSelections } from '../../_lib/funs';
import { emptyEqpt } from './datas';
import { EqptsMasterDialogValues, EqptsMasterTableValues, nullToZero, SelectedEqptsValues, zeroToNull } from './types';

/**
 * 機材マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<EqptsMasterTableValues[]>} 機材マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredEqpts = async (queries: { q: string; b: number; d: number; s: number }) => {
  const builder = supabase
    .schema('dev2')
    .from('v_kizai_lst')
    .select(
      'kizai_id, kizai_nam, kizai_qty, shozoku_nam, mem, bumon_nam, dai_bumon_nam, shukei_bumon_nam, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, dsp_flg, del_flg'
    )
    .order('kizai_grp_cod')
    .order('dsp_ord_num');

  if (queries.q && queries.q.trim() !== '') {
    builder.ilike('kizai_nam', `%${queries.q}%`);
  }
  if (queries.b !== 0) {
    builder.eq('bumon_id', queries.b);
  }
  if (queries.d !== 0) {
    builder.eq('dai_bumon_id', queries.d);
  }
  if (queries.s !== 0) {
    builder.eq('shukei_bumon_id', queries.s);
  }
  try {
    const options = await getAllBumonSelections();
    const { data, error } = await builder;
    if (!error) {
      console.log('機材マスタDBからデータもらった');
      if (!data || data.length === 0) {
        return { data: [], options: options };
      } else {
        const filteredEqpts: EqptsMasterTableValues[] = data.map((d, index) => ({
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
          dspFlg: d.dsp_flg,
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
        }));
        console.log('機材マスタリストを取得した');
        return { data: filteredEqpts, options: options };
      }
    } else {
      console.error('機材情報取得エラー。', { message: error.message, code: error.code });
      return { data: [], options: options };
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/eqpt-master');
};

/**
 * 選択された機材のデータを取得する関数
 * @param id 機材マスタID
 * @returns {Promise<{data: EqptsMasterDialogValues, qty: } | undefined>}
 *  data: 機材情報, qty: 保有数
 */
export const getOneEqpt = async (id: number) => {
  try {
    const { data, error } = await supabase.schema('dev2').from('m_kizai').select('*').eq('kizai_id', id).single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);
      const EqptDetails: EqptsMasterDialogValues = {
        kizaiNam: data.kizai_nam,
        sectionNum: data.section_num,
        elNum: data.el_num,
        delFlg: Boolean(data.del_flg),
        shozokuId: nullToZero(data.shozoku_id),
        bldCod: data.bld_cod,
        tanaCod: data.tana_cod,
        edaCod: data.eda_cod,
        kizaiGrpCod: data.kizai_grp_cod,
        dspOrdNum: data.dsp_ord_num,
        mem: data.mem,
        bumonId: nullToZero(data.bumon_id),
        shukeibumonId: nullToZero(data.shukei_bumon_id),
        dspFlg: Boolean(data.dsp_flg),
        ctnFlg: Boolean(data.ctn_flg),
        defDatQty: data.def_dat_qty,
        regAmt: data.reg_amt,
        rankAmt1: data.rank_amt_1,
        rankAmt2: data.rank_amt_2,
        rankAmt3: data.rank_amt_3,
        rankAmt4: data.rank_amt_4,
        rankAmt5: data.rank_amt_5,
        addUser: data.add_user,
        addDat: data.add_dat,
        updUser: data.upd_user,
        updDat: data.upd_dat,
      };
      console.log(EqptDetails.addUser, ' ', EqptDetails.addDat);
      const qty = await getEqptsQty(id);
      return { data: EqptDetails, qty: qty };
    } else {
      console.error('機材情報取得エラー。', { message: error.message, code: error.code });
      return { data: emptyEqpt, qty: undefined };
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return { data: emptyEqpt, qty: undefined };
  }
};

/**
 * 機材マスタに新規登録する関数
 * @param data フォームで取得した機材情報
 */
export const addNewEqpt = async (data: EqptsMasterDialogValues) => {
  console.log('機材マスタを追加する');
  const query = `
      INSERT INTO m_kizai (
        kizai_id, kizai_nam, del_flg, section_num, el_num, shozoku_id,
        bld_cod, tana_cod, eda_cod, kizai_grp_cod, dsp_ord_num, mem,
        bumon_id, shukei_bumon_id, dsp_flg, ctn_flg, def_dat_qty,
        reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, 
        add_dat, add_user
      )
      VALUES (
        (SELECT coalesce(max(kizai_id),0) + 1 FROM m_kizai),
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $24,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      );
    `;

  const date = new Date()
    .toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour12: false,
    })
    .replace(/\//g, '-');
  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);
    await pool.query(query, [
      data.kizaiNam,
      Number(data.delFlg),
      data.sectionNum,
      data.elNum,
      data.shozokuId,
      data.bldCod,
      data.tanaCod,
      data.edaCod,
      data.kizaiGrpCod,
      data.mem,
      zeroToNull(data.bumonId),
      zeroToNull(data.shukeibumonId),
      Number(data.dspFlg),
      Number(data.ctnFlg),
      data.defDatQty,
      data.regAmt,
      data.rankAmt1,
      data.rankAmt2,
      data.rankAmt3,
      data.rankAmt4,
      data.rankAmt5,
      date,
      'shigasan',
      data.dspOrdNum,
    ]);
    console.log('機材マスタを追加した data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/eqpt-master');
};

/**
 * 機材マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する機材マスタID
 */
export const updateEqpt = async (data: EqptsMasterDialogValues, id: number) => {
  console.log('Update!!!waaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', data);
  const missingData = {
    kizai_nam: data.kizaiNam,
    del_flg: Number(data.delFlg),
    section_num: data.sectionNum,
    el_num: data.elNum,
    shozoku_id: zeroToNull(data.shozokuId),
    bld_cod: data.bldCod,
    tana_cod: data.tanaCod,
    eda_cod: data.edaCod,
    kizai_grp_cod: data.kizaiGrpCod,
    dsp_ord_num: data.dspOrdNum,
    mem: data.mem,
    bumon_id: zeroToNull(data.bumonId),
    shukei_bumon_id: zeroToNull(data.shukeibumonId),
    dsp_flg: Number(data.dspFlg),
    ctn_flg: Number(data.ctnFlg),
    def_dat_qty: data.defDatQty,
    reg_amt: data.regAmt,
    rank_amt_1: data.rankAmt1,
    rank_amt_2: data.rankAmt2,
    rank_amt_3: data.rankAmt3,
    rank_amt_4: data.rankAmt4,
    rank_amt_5: data.rankAmt5,
  };
  console.log(missingData.del_flg);
  const date = new Date()
    .toLocaleString('ja-JP', {
      timeZone: 'Asia/Tokyo',
      hour12: false,
    })
    .replace(/\//g, '-');

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.kizai_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_kizai')
      .update({ ...theData })
      .eq('kizai_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('機材を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生しました', error);
    throw error;
  }
  revalidatePath('/eqpt-master');
};

export const getEqptsQty = async (id: number) => {
  try {
    const { count, error } = await supabase
      .schema('dev2')
      .from('m_rfid')
      .select('*', { count: 'exact', head: true })
      .eq('kizai_id', id);
    if (error) {
      console.error('Error counting filtered rows:', error);
    } else {
      console.log('Filtered rows :::::::::::', count);
    }
    if (!error) {
      if (!count || count === 0) {
        return undefined;
      } else {
        return count;
      }
    } else {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      return undefined;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
};

export const createEqptHistory = async (data: EqptsMasterDialogValues, id: number) => {
  // console.log(
  //   'うわあああああああああああああああああああああああああああああああああああああああああああああああああああ',
  //   data
  // );
  console.log(data.mem);

  const query = `
      INSERT INTO m_kizai_his (
        kizai_id_his_num, kizai_id, kizai_nam, del_flg, section_num, el_num, shozoku_id,
        bld_cod, tana_cod, eda_cod, kizai_grp_cod, dsp_ord_num, mem,
        bumon_id, shukei_bumon_id, dsp_flg, ctn_flg, def_dat_qty,
        reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, add_user, add_dat, upd_user, upd_dat
        
      )
      VALUES (
        (SELECT coalesce(max(kizai_id_his_num),0) + 1 FROM m_kizai_his),
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26 ,$27
      );
    `;

  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);

    await pool.query(query, [
      id,
      data.kizaiNam,
      Number(data.delFlg),
      data.sectionNum,
      data.elNum,
      zeroToNull(data.shozokuId),
      data.bldCod,
      data.tanaCod,
      data.edaCod,
      data.kizaiGrpCod,
      data.dspOrdNum,
      data.mem,
      zeroToNull(data.bumonId),
      zeroToNull(data.shukeibumonId),
      Number(data.dspFlg),
      Number(data.ctnFlg),
      data.defDatQty,
      data.regAmt,
      data.rankAmt1,
      data.rankAmt2,
      data.rankAmt3,
      data.rankAmt4,
      data.rankAmt5,
      data.addUser,
      data.addDat,
      data.updUser,
      data.updDat,
    ]);
    console.log('data : ', data);
    return { success: true };
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 機材選択に表示するための機材リスト
 * @param query 検索キーワード
 * @returns
 */
export const getEqptsForEqptSelection = async (query: string): Promise<EqptSelection[] | undefined> => {
  try {
    await pool.query(` SET search_path TO dev2;`);

    const data = await pool.query(
      `
      SELECT
        k.kizai_id as "kizaiId",
        k.kizai_nam as "kizaiNam",
        s.shozoku_nam as "shozokuNam",
        k.bumon_id as "bumonId",
        k.kizai_grp_cod as "kizaiGrpCod"
      FROM
        dev2.m_kizai as k
      INNER JOIN
        dev2.m_shozoku as s
      ON
        k.shozoku_id = s.shozoku_id
      WHERE
        k.del_flg <> 1
        AND k.dsp_flg <> 0
        AND k.kizai_nam ILIKE $1
      ORDER BY
        k.kizai_grp_cod,
        k.dsp_ord_num;
      `,
      [`%${query}%`]
    );

    if (data && data.rows) {
      return data.rows;
    }
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/eqpt-master');
};

/**
 * 最終的に選ばれたすべの機材IDから、機材の配列を取得する関数
 * @param idList 最終的に選ばれたすべの機材IDの配列
 * @param rank 顧客ランク
 * @returns {SelectedEqptsValues[]} 表に渡す機材の配列
 */
export const getSelectedEqpts = async (idList: number[], rank: number) => {
  const rankParse = (rank: number) => {};
  try {
    const { data, error } = await await supabase
      .schema('dev2')
      .from('m_kizai')
      .select(
        `kizai_id, kizai_nam, kizai_grp_cod, dsp_ord_num, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5`
      )
      .in('kizai_id', idList)
      .order('kizai_grp_cod')
      .order('dsp_ord_num');
    if (!error) {
      if (!data) return [];
      const selectedEqpts: SelectedEqptsValues[] = data.map((d) => ({
        kizaiId: d.kizai_id,
        kizaiNam: d.kizai_nam,
        kizaiGrpCod: d.kizai_grp_cod,
        dspOrdNum: d.dsp_ord_num,
        regAmt: d.reg_amt,
        rankAmt:
          rank === 1
            ? d.rank_amt_1
            : rank === 2
              ? d.rank_amt_2
              : rank === 3
                ? d.rank_amt_3
                : rank === 4
                  ? d.rank_amt_4
                  : rank === 5
                    ? d.rank_amt_5
                    : 0,
      }));
      return selectedEqpts;
    } else {
      console.error('DBエラーだよ', error);
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
