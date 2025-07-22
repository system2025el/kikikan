'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { emptyEqpt } from './datas';
import { EqptsMasterDialogValues, EqptsMasterTableValues } from './types';

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
        const filteredEqpts: EqptsMasterTableValues[] = data.map((d) => ({
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
  revalidatePath('/eqpts-master');
};

// /**
//  * 選択された機材のデータを取得する関数
//  * @param id 機材マスタID
//  * @returns {Promise<EqptsMasterDialogValues>} - 機材の詳細情報。取得失敗時は空オブジェクトを返します。
//  */
// export const getOneEqpt = async (id: number) => {
//   try {
//     const { data, error } = await supabase
//       .schema('dev2')
//       .from('m_Eqpt')
//       .select('Eqpt_nam, del_flg, dai_Eqpt_id, syukei_Eqpt_id, mem ')
//       .eq('Eqpt_id', id)
//       .single();
//     if (!error) {
//       console.log('I got a datalist from db', data.del_flg);

//       const EqptDetails: EqptsMasterDialogValues = {
//         EqptNam: data.Eqpt_nam,
//         delFlg: Boolean(data.del_flg),
//         mem: data.mem,
//         daiEqptId: data.dai_Eqpt_id,
//         shukeiEqptId: data.syukei_Eqpt_id,
//       };
//       console.log(EqptDetails.delFlg);
//       return EqptDetails;
//     } else {
//       console.error('機材情報取得エラー。', { message: error.message, code: error.code });
//       return emptyEqpt;
//     }
//   } catch (e) {
//     console.error('例外が発生しました:', e);
//     return emptyEqpt;
//   }
// };

// /**
//  * 機材マスタに新規登録する関数
//  * @param data フォームで取得した機材情報
//  */
// export const addNewEqpt = async (data: EqptsMasterDialogValues) => {
//   console.log(data.mem);

//   const query = `
//       INSERT INTO m_Eqpt (
//         Eqpt_id, Eqpt_nam, del_flg, dsp_ord_num,
//         dai_Eqpt_id, syukei_Eqpt_id,
//         mem, add_dat, add_user, upd_dat, upd_user
//       )
//       VALUES (
//         (SELECT coalesce(max(Eqpt_id),0) + 1 FROM m_Eqpt),
//         $1, $2,
//         (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_Eqpt),
//         $3, $4, $5, $6, $7, $8, $9
//       );
//     `;

//   const date = new Date()
//     .toLocaleString('ja-JP', {
//       timeZone: 'Asia/Tokyo',
//       hour12: false,
//     })
//     .replace(/\//g, '-');
//   try {
//     console.log('DB Connected');
//     await pool.query(` SET search_path TO dev2;`);

//     await pool.query(query, [
//       data.EqptNam,
//       Number(data.delFlg),
//       data.daiEqptId,
//       data.shukeiEqptId,
//       data.mem,
//       date,
//       'shigasan',
//       null,
//       null,
//     ]);
//     console.log('data : ', data);
//   } catch (error) {
//     console.log('DB接続エラー', error);
//     throw error;
//   }
//   await revalidatePath('/Eqpts-master');
// };

// /**
//  * 機材マスタの情報を更新する関数
//  * @param data フォームに入力されている情報
//  * @param id 更新する機材マスタID
//  */
// export const updateEqpt = async (data: EqptsMasterDialogValues, id: number) => {
//   console.log('Update!!!', data.mem);
//   const missingData = {
//     Eqpt_nam: data.EqptNam,
//     del_flg: Number(data.delFlg),
//     mem: data.mem,
//     dai_Eqpt_id: data.daiEqptId,
//     syukei_Eqpt_id: data.shukeiEqptId,
//   };
//   console.log(missingData.del_flg);
//   const date = new Date()
//     .toLocaleString('ja-JP', {
//       timeZone: 'Asia/Tokyo',
//       hour12: false,
//     })
//     .replace(/\//g, '-');

//   const theData = {
//     ...missingData,
//     upd_dat: date,
//     upd_user: 'test_user',
//   };
//   console.log(theData.Eqpt_nam);

//   try {
//     const { error: updateError } = await supabase
//       .schema('dev2')
//       .from('m_Eqpt')
//       .update({ ...theData })
//       .eq('Eqpt_id', id);

//     if (updateError) {
//       console.error('更新に失敗しました:', updateError.message);
//       throw updateError;
//     } else {
//       console.log('機材を更新しました : ', theData.del_flg);
//     }
//   } catch (error) {
//     console.log('例外が発生しました', error);
//     throw error;
//   }
//   revalidatePath('/Eqpt-master');
// };

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
//   revalidatePath('/Eqpts-master');
//   redirect('/Eqpts-master');
// };
