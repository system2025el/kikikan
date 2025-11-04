'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { insertNewEqpt, selectActiveEqpts, selectOneEqpt, upDateEqptDB } from '@/app/_lib/db/tables/m-kizai';
import { insertEqptHistory } from '@/app/_lib/db/tables/m-kizai-his';
import { updateMasterUpdates } from '@/app/_lib/db/tables/m-master-update';
import { selectCountOfTheEqpt } from '@/app/_lib/db/tables/m-rfid';
import { selectFilteredEqpts } from '@/app/_lib/db/tables/v-kizai-list';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { getBumonsSelection, getDaibumonsSelection, getShukeibumonsSelection } from '../../_lib/funcs';
import { fakeToNull, nullToFake } from '../../_lib/value-converters';
import { emptyEqpt } from './datas';
import { EqptsMasterDialogValues, EqptsMasterTableValues } from './types';

/**
 * 機材マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<EqptsMasterTableValues[]>} 機材マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredEqpts = async (
  queries: { q: string; b: number | null; d: number | null; s: number | null; ngFlg: boolean } = {
    q: '',
    b: null,
    d: null,
    s: null,
    ngFlg: false,
  }
) => {
  try {
    const [kizai, doptions, soptions, boption] = await Promise.all([
      selectFilteredEqpts(queries),
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
      getBumonsSelection(),
    ]);
    const { data, error } = kizai;
    const options = { d: doptions, s: soptions, b: boption };
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return { data: [], options: options };
    }
    const filteredEqpts: EqptsMasterTableValues[] = data.map((d, index) => ({
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      kizaiQty: Number(d.kizai_qty) + Number(d.kizai_ng_qty),
      ngQty: Number(d.kizai_ng_qty ?? 0),
      yukoQty: Number(d.kizai_qty ?? 0),
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      bumonNam: d.bumon_nam,
      daibumonNam: d.dai_bumon_nam,
      shukeibumonNam: d.shukei_bumon_nam,
      regAmt: d.reg_amt,
      // rankAmt1: d.rank_amt_1,
      // rankAmt2: d.rank_amt_2,
      // rankAmt3: d.rank_amt_3,
      // rankAmt4: d.rank_amt_4,
      // rankAmt5: d.rank_amt_5,
      dspFlg: Boolean(d.dsp_flg),
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log('機材マスタリストを取得した');
    return { data: filteredEqpts, options: options };
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された機材のデータを取得する関数
 * @param id 機材マスタID
 * @returns {Promise<{data: EqptsMasterDialogValues, qty: } | undefined>}
 *  data: 機材情報, qty: 保有数
 */
export const getChosenEqpt = async (id: number) => {
  try {
    const [kizai, qty] = await Promise.all([selectOneEqpt(id), getEqptsQty(id)]);
    const { data, error } = kizai;
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return { data: emptyEqpt, qty: qty };
    }
    const EqptDetails: EqptsMasterDialogValues = {
      kizaiNam: data.kizai_nam,
      sectionNum: data.section_num,
      elNum: data.el_num,
      delFlg: Boolean(data.del_flg),
      shozokuId: nullToFake(data.shozoku_id),
      bldCod: data.bld_cod,
      tanaCod: data.tana_cod,
      edaCod: data.eda_cod,
      kizaiGrpCod: data.kizai_grp_cod,
      dspOrdNum: data.dsp_ord_num,
      mem: data.mem,
      bumonId: nullToFake(data.bumon_id),
      shukeibumonId: nullToFake(data.shukei_bumon_id),
      dspFlg: Boolean(data.dsp_flg),
      ctnFlg: Boolean(data.ctn_flg),
      defDatQty: data.def_dat_qty,
      regAmt: data.reg_amt ?? 0,
      // rankAmt1: data.rank_amt_1,
      // rankAmt2: data.rank_amt_2,
      // rankAmt3: data.rank_amt_3,
      // rankAmt4: data.rank_amt_4,
      // rankAmt5: data.rank_amt_5,
      addUser: data.add_user,
      addDat: data.add_dat,
      updUser: data.upd_user,
      updDat: data.upd_dat,
    };

    return { data: EqptDetails, qty: qty };
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 機材マスタに新規登録する関数
 * @param data フォームで取得した機材情報
 */
export const addNewEqpt = async (data: EqptsMasterDialogValues, user: string) => {
  console.log('機材マスタを追加する');
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await insertNewEqpt(data, connection, user);
    await updateMasterUpdates('m_kizai', connection);
    await connection.query('COMMIT');

    await revalidatePath('/eqpt-master');
  } catch (error) {
    await connection.query('ROLLBACK');

    console.log('DB接続エラー', error);
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 機材マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する機材マスタID
 */
export const updateEqpt = async (
  currentData: EqptsMasterDialogValues,
  rawData: EqptsMasterDialogValues,
  id: number,
  user: string
) => {
  const date = toJapanTimeString();
  const updateData = {
    kizai_id: id,
    kizai_nam: rawData.kizaiNam,
    del_flg: Number(rawData.delFlg),
    section_num: rawData.sectionNum,
    shozoku_id: Number(rawData.shozokuId),
    bld_cod: rawData.bldCod,
    tana_cod: rawData.tanaCod,
    eda_cod: rawData.edaCod,
    kizai_grp_cod: rawData.kizaiGrpCod,
    dsp_ord_num: rawData.dspOrdNum,
    mem: rawData.mem,
    bumon_id: fakeToNull(rawData.bumonId),
    shukei_bumon_id: fakeToNull(rawData.shukeibumonId),
    dsp_flg: Number(rawData.dspFlg),
    ctn_flg: Number(rawData.ctnFlg),
    def_dat_qty: rawData.defDatQty,
    reg_amt: rawData.regAmt,
    // rank_amt_1: rawData.rankAmt1,
    // rank_amt_2: rawData.rankAmt2,
    // rank_amt_3: rawData.rankAmt3,
    // rank_amt_4: rawData.rankAmt4,
    // rank_amt_5: rawData.rankAmt5,
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.kizai_nam);
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    await insertEqptHistory(currentData, id, connection);
    await upDateEqptDB(updateData, connection);
    await updateMasterUpdates('m_kizai', connection);
    await revalidatePath('/eqpt-master');
    await connection.query('COMMIT');
  } catch (error) {
    await connection.query('ROLLBACK');
    console.log('例外が発生しました', error);
    throw error;
  } finally {
    await connection.release();
  }
};

/**
 * 機材の保有数を取得する関数
 * @param id 機材ID
 * @returns idの機材の保有数とNG数
 */
export const getEqptsQty = async (id: number) => {
  try {
    const { data, error } = await selectCountOfTheEqpt(id);
    if (error || error) {
      console.error('DB情報取得エラー', error?.message, error?.message);
      throw new Error('保有数取得エラー');
    }
    return { all: data.kizai_qty ?? 0, ng: data.kizai_ng_qty ?? 0 };
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
