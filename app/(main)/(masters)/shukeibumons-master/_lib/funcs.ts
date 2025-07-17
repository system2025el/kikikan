'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { emptyShukeibumon } from './datas';
import { ShukeibumonsMasterDialogValues, ShukeibumonsMasterTableValues } from './types';

// export const getAllShukeibumon = async () => {
//   try {
//     const { data, error } = await supabase
//       .schema('dev2')
//       .from('m_Shukeibumon')
//       .select('Shukeibumon_id , Shukeibumon_nam, adr_shozai, adr_tatemono, adr_sonota, tel, fax, mem,  ')
//       .neq('del_flg', 1)
//       .order('dsp_ord_num');
//     if (!error) {
//       console.log('I got a datalist from db', data.length);

//       const theData: ShukeibumonsMasterTableValues[] = data.map((d) => ({
//         ShukeibumonId: d.Shukeibumon_id,
//         ShukeibumonNam: d.Shukeibumon_nam,
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
//   revalidatePath('/Shukeibumons-master');
//   redirect('/Shukeibumons-master');
// };

/**
 * 集計部門マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<ShukeibumonsMasterTableValues[]>} 集計部門マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredShukeibumons = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_shukei_bumon')
      .select('shukei_bumon_id, shukei_bumon_nam, mem') // テーブルに表示するカラム
      .ilike('shukei_bumon_nam', `%${query}%`)
      //   // あいまい検索、集計部門名、集計部門名かな、住所、電話番号、fax番号
      //   .or(`shukei_bumon_nam.ilike.%${query}%`)
      .neq('del_flg', 1) // 削除フラグが立っていない
      .order('dsp_ord_num'); // 並び順
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredShukeibumons: ShukeibumonsMasterTableValues[] = data.map((d) => ({
          shukeibumonId: d.shukei_bumon_id,
          shukeibumonNam: d.shukei_bumon_nam,
          mem: d.mem,
        }));
        console.log(filteredShukeibumons.length);
        return filteredShukeibumons;
      }
    } else {
      console.error('集計部門情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/hukeibumons-master');
};

/**
 * 選択された集計部門のデータを取得する関数
 * @param id 集計部門マスタID
 * @returns {Promise<ShukeibumonsMasterDialogValues>} - 集計部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneShukeibumon = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_shukei_bumon')
      .select('shukei_bumon_nam, del_flg, mem')
      .eq('shukei_bumon_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const ShukeibumonDetails: ShukeibumonsMasterDialogValues = {
        shukeibumonNam: data.shukei_bumon_nam,
        delFlg: Boolean(data.del_flg),
        mem: data.mem,
      };
      console.log(ShukeibumonDetails.delFlg);
      return ShukeibumonDetails;
    } else {
      console.error('集計部門情報取得エラー。', { message: error.message, code: error.code });
      return emptyShukeibumon;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyShukeibumon;
  }
};

/**
 * 集計部門マスタに新規登録する関数
 * @param data フォームで取得した集計部門情報
 */
export const addNewShukeibumon = async (data: ShukeibumonsMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_shukei_bumon (
        shukei_bumon_id, shukei_bumon_nam, del_flg, dsp_ord_num,
        mem, add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(shukei_bumon_id),0) + 1 FROM m_shukei_bumon),
        $1, $2,
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_shukei_bumon),
        $3, $4, $5, $6, $7
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

    await pool.query(query, [data.shukeibumonNam, Number(data.delFlg), data.mem, date, 'shigasan', null, null]);
    console.log('data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/shukeibumons-master');
};

/**
 * 集計部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する集計部門マスタID
 */
export const updateShukeibumon = async (data: ShukeibumonsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    shukei_bumon_nam: data.shukeibumonNam,
    del_flg: Number(data.delFlg),
    mem: data.mem,
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
  console.log(theData.shukei_bumon_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_shukei_bumon')
      .update({ ...theData })
      .eq('shukei_bumon_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('集計部門を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/shukeibumon-master');
};
