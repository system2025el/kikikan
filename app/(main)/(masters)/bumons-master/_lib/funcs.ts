'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { getAllBumonDSSelections, getAllSelections } from '../../_lib/funs';
import { emptyBumon } from './datas';
import { BumonsMasterDialogValues, BumonsMasterTableValues } from './types';

/**
 * 部門マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<bumonsMasterTableValues[]>} 部門マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredBumons = async (queries: { q: string; d: number; s: number }) => {
  const builder = supabase
    .schema('dev2')
    .from('m_bumon')
    .select('bumon_id, bumon_nam, mem, del_flg')
    .order('dsp_ord_num');

  if (queries.q && queries.q.trim() !== '') {
    builder.ilike('bumon_nam', `%${queries.q}%`);
  }
  if (queries.d !== 0) {
    builder.eq('dai_bumon_id', queries.d);
  }
  if (queries.s !== 0) {
    builder.eq('syukei_bumon_id', queries.s);
  }

  try {
    const { data, error } = await builder;
    const options = await getAllBumonDSSelections();
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return { data: [], options: options };
      } else {
        const filteredbumons: BumonsMasterTableValues[] = data.map((d, index) => ({
          bumonId: d.bumon_id,
          bumonNam: d.bumon_nam,
          mem: d.mem,
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
        }));
        console.log(filteredbumons.length);
        return { data: filteredbumons, options: options };
      }
    } else {
      console.error('部門情報取得エラー。', { message: error.message, code: error.code });
      return { data: [], options: options };
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/bumons-master');
};

/**
 * 選択された部門のデータを取得する関数
 * @param id 部門マスタID
 * @returns {Promise<bumonsMasterDialogValues>} - 部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOnebumon = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_bumon')
      .select('bumon_nam, del_flg, dai_bumon_id, syukei_bumon_id, mem ')
      .eq('bumon_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const bumonDetails: BumonsMasterDialogValues = {
        bumonNam: data.bumon_nam,
        delFlg: Boolean(data.del_flg),
        mem: data.mem,
        daibumonId: data.dai_bumon_id,
        shukeibumonId: data.syukei_bumon_id,
      };
      console.log(bumonDetails.delFlg);
      return bumonDetails;
    } else {
      console.error('部門情報取得エラー。', { message: error.message, code: error.code });
      return emptyBumon;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyBumon;
  }
};

/**
 * 部門マスタに新規登録する関数
 * @param data フォームで取得した部門情報
 */
export const addNewBumon = async (data: BumonsMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_bumon (
        bumon_id, bumon_nam, del_flg, dsp_ord_num,
        dai_bumon_id, syukei_bumon_id,
        mem, add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(bumon_id),0) + 1 FROM m_bumon),
        $1, $2,
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_bumon),
        $3, $4, $5, $6, $7, $8, $9
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
      data.bumonNam,
      Number(data.delFlg),
      data.daibumonId,
      data.shukeibumonId,
      data.mem,
      date,
      'shigasan',
      null,
      null,
    ]);
    console.log('data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/bumons-master');
};

/**
 * 部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する部門マスタID
 */
export const updateBumon = async (data: BumonsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    bumon_nam: data.bumonNam,
    del_flg: Number(data.delFlg),
    mem: data.mem,
    dai_bumon_id: data.daibumonId,
    syukei_bumon_id: data.shukeibumonId,
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
  console.log(theData.bumon_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_bumon')
      .update({ ...theData })
      .eq('bumon_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('部門を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生しました', error);
    throw error;
  }
  revalidatePath('/bumon-master');
};

export const getAllBumon = async () => {
  try {
    const { data, error } = await supabase.schema('dev2').from('m_bumon').select('*').order('dsp_ord_num');
    if (!error) {
      console.log('I got a datalist from db', data.length);
      console.log(data.length);
      const aoaData = data.map((d) => [
        d.bumon_id,
        d.bumon_nam,
        d.del_flg,
        d.dsp_ord_num,
        d.mem,
        d.dai_bumon_id,
        d.shukei_bumon_id,
        d.add_dat,
        d.add_user,
        d.upd_dat,
        d.upd_user,
      ]);
      return aoaData;
    } else {
      console.error('DBエラーです', error.message);
      return [];
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};
// export const getAllbumon = async () => {
//   try {
//     const { data, error } = await supabase
//       .schema('dev2')
//       .from('m_bumon')
//       .select('bumon_id , bumon_nam, adr_shozai, adr_tatemono, adr_sonota, tel, fax, mem,  ')
//
//       .order('dsp_ord_num');
//     if (!error) {
//       console.log('I got a datalist from db', data.length);

//       const theData: bumonsMasterTableValues[] = data.map((d) => ({
//         bumonId: d.bumon_id,
//         bumonNam: d.bumon_nam,
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
//   revalidatePath('/bumons-master');
//   redirect('/bumons-master');
// };
