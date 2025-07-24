'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { emptyEqpt } from './datas';
import { EqptsMasterDialogValues, EqptsMasterTableValues, nullToZero, zeroToNull } from './types';

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
      'kizai_id, kizai_nam, kizai_qty, shozoku_nam, mem, bumon_nam, dai_bumon_nam, shukei_bumon_nam, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, dsp_flg'
    )
    .neq('del_flg', 1)
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
    const { data, error } = await builder;

    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredEqpts: EqptsMasterTableValues[] = data.map((d, index) => ({
          kizaiId: d.kizai_id,
          kizaiNam: d.kizai_nam,
          kizaiQty: d.kizai_qty,
          shozokuNam: d.shozoku_nam.substring(0, 1),
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
          dspOrdNum: index + 1,
        }));
        console.log(filteredEqpts.length);
        return filteredEqpts;
      }
    } else {
      console.error('機材情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/eqpt-master');
};

/**
 * 選択された機材のデータを取得する関数
 * @param id 機材マスタID
 * @returns {Promise<EqptsMasterDialogValues>} - 機材の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneEqpt = async (id: number) => {
  try {
    const { data, error } = await supabase.schema('dev2').from('m_kizai').select('*').eq('kizai_id', id).single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const EqptDetails: EqptsMasterDialogValues = {
        kizaiNam: data.kizai_nam,
        sectionNum: nullToZero(data.section_num),
        elNum: nullToZero(data.el_num),
        delFlg: Boolean(data.del_flg),
        shozokuId: data.shozoku_id,
        bldCod: data.bld_cod,
        tanaCod: data.tana_cod,
        edaCod: data.eda_cod,
        kizaiGrpCod: data.kizai_grp_cod,
        dspOrdNum: nullToZero(data.dsp_ord_num),
        mem: data.mem,
        bumonId: nullToZero(data.bumon_id),
        shukeibumonId: nullToZero(data.shukei_bumon_id),
        dspFlg: Boolean(data.dsp_flg),
        ctnFlg: Boolean(data.ctn_flg),
        defDatQty: nullToZero(data.def_dat_qty),
        regAmt: data.reg_amt,
        rankAmt1: nullToZero(data.rank_amt_1),
        rankAmt2: nullToZero(data.rank_amt_2),
        rankAmt3: nullToZero(data.rank_amt_3),
        rankAmt4: nullToZero(data.rank_amt_4),
        rankAmt5: nullToZero(data.rank_amt_5),
        addUser: data.add_user,
        addDat: data.add_dat,
        updUser: data.upd_user,
        updDat: data.upd_dat,
      };
      console.log(EqptDetails.addUser, ' ', EqptDetails.addDat);
      return EqptDetails;
    } else {
      console.error('機材情報取得エラー。', { message: error.message, code: error.code });
      return emptyEqpt;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyEqpt;
  }
};

/**
 * 機材マスタに新規登録する関数
 * @param data フォームで取得した機材情報
 */
export const addNewEqpt = async (data: EqptsMasterDialogValues) => {
  console.log(data.mem);

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
      zeroToNull(data.sectionNum),
      zeroToNull(data.elNum),
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
      zeroToNull(data.defDatQty),
      data.regAmt,
      zeroToNull(data.rankAmt1),
      zeroToNull(data.rankAmt2),
      zeroToNull(data.rankAmt3),
      zeroToNull(data.rankAmt4),
      zeroToNull(data.rankAmt5),
      date,
      'shigasan',
      zeroToNull(data.dspOrdNum),
    ]);
    console.log('data : ', data);
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
    section_num: zeroToNull(data.sectionNum),
    el_num: zeroToNull(data.elNum),
    shozoku_id: data.shozokuId,
    bld_cod: data.bldCod,
    tana_cod: data.tanaCod,
    eda_cod: data.edaCod,
    kizai_grp_cod: data.kizaiGrpCod,
    dsp_ord_num: zeroToNull(data.dspOrdNum),
    mem: data.mem,
    bumon_id: zeroToNull(data.bumonId),
    shukei_bumon_id: zeroToNull(data.shukeibumonId),
    dsp_flg: Number(data.dspFlg),
    ctn_flg: Number(data.ctnFlg),
    def_dat_qty: zeroToNull(data.defDatQty),
    reg_amt: data.regAmt,
    rank_amt_1: zeroToNull(data.rankAmt1),
    rank_amt_2: zeroToNull(data.rankAmt2),
    rank_amt_3: zeroToNull(data.rankAmt3),
    rank_amt_4: zeroToNull(data.rankAmt4),
    rank_amt_5: zeroToNull(data.rankAmt5),
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
      zeroToNull(data.sectionNum),
      zeroToNull(data.elNum),
      data.shozokuId,
      data.bldCod,
      data.tanaCod,
      data.edaCod,
      data.kizaiGrpCod,
      zeroToNull(data.dspOrdNum),
      data.mem,
      zeroToNull(data.bumonId),
      zeroToNull(data.shukeibumonId),
      Number(data.dspFlg),
      Number(data.ctnFlg),
      zeroToNull(data.defDatQty),
      data.regAmt,
      zeroToNull(data.rankAmt1),
      zeroToNull(data.rankAmt2),
      zeroToNull(data.rankAmt3),
      zeroToNull(data.rankAmt4),
      zeroToNull(data.rankAmt5),
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

// export const getAllEqpt = async () => {
//   try {
//     const { data, error } = await supabase
//       .schema('dev2')
//       .from('m_Eqpt')
//       .select('Eqpt_id , Eqpt_nam, adr_shozai, adr_tatemono, adr_sonota, tel, fax, mem,  ')
//       .neq('del_flg', 1)
//       .order('dsp_ord_num');
//     if (!error) {
//       console.log('I got a datalist from db', data.length);

//       const theData: EqptsMasterTableValues[] = data.map((d) => ({
//         EqptId: d.Eqpt_id,
//         EqptNam: d.Eqpt_nam,
//         adrShozai: d.adr_shozai,
//         adrTatemono: d.adr_tatemono,
//         adrSonota: d.adr_sonota,
//         tel: d.tel,
//         fax: d.fax,
//         mem: d.mem,
//         dspFlg: d.,
//       }));

//       console.log(theData.length);
//       return theData;
//     } else {
//       console.error('DBエラーです', error.message);
//     }
//   } catch (e) {
//     console.log(e);
//   }
//   revalidatePath('/eqpt-master');
//   redirect('/eqpt-master');
// };
