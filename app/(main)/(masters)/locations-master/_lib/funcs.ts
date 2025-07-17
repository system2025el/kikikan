'use server';

import { revalidatePath } from 'next/cache';
import { QueryResult } from 'pg';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { emptyLoc } from './datas';
import { LocsMasterDialogValues, LocsMasterTableValues } from './types';

// export const getAllLoc = async () => {
//   try {
//     const { data, error } = await supabase
//       .schema('dev2')
//       .from('m_koenbasho')
//       .select('koenbasho_id , koenbasho_nam, adr_shozai, adr_tatemono, adr_sonota, tel, fax, mem,  dsp_flg')
//       .neq('del_flg', 1)
//       .order('dsp_ord_num');
//     if (!error) {
//       console.log('I got a datalist from db', data.length);

//       const theData: LocsMasterTableValues[] = data.map((d) => ({
//         locId: d.koenbasho_id,
//         locNam: d.koenbasho_nam,
//         adrShozai: d.adr_shozai,
//         adrTatemono: d.adr_tatemono,
//         adrSonota: d.adr_sonota,
//         tel: d.tel,
//         fax: d.fax,
//         mem: d.mem,
//         dspFlg: d.dsp_flg,
//       }));

//       console.log(theData.length);
//       return theData;
//     } else {
//       console.error('DBエラーです', error.message);
//     }
//   } catch (e) {
//     console.log(e);
//   }
//   revalidatePath('/locations-master');
//   redirect('/location-master');
// };

/**
 * 公演場所マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<LocsMasterTableValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredLocs = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .select('koenbasho_id, koenbasho_nam, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, dsp_flg') // テーブルに表示するカラム
      // あいまい検索、場所名、場所名かな、住所、電話番号、fax番号
      .or(
        `koenbasho_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
      )
      .neq('del_flg', 1) // 削除フラグが立っていない
      .order('dsp_ord_num'); // 並び順
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredLocs: LocsMasterTableValues[] = data.map((d) => ({
          locId: d.koenbasho_id,
          locNam: d.koenbasho_nam,
          adrShozai: d.adr_shozai,
          adrTatemono: d.adr_tatemono,
          adrSonota: d.adr_sonota,
          tel: d.tel,
          fax: d.fax,
          mem: d.mem,
          dspFlg: Boolean(d.dsp_flg),
        }));
        console.log(filteredLocs.length);
        return filteredLocs;
      }
    } else {
      console.error('公演場所情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/locations-master');
};

/**
 * 選択された公演場所のデータを取得する関数
 * @param id 公演場所マスタID
 * @returns {Promise<LocsMasterDialogValues>} - 公演場所の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneLoc = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .select(
        'koenbasho_id, koenbasho_nam, kana, del_flg, adr_post, adr_shozai, adr_tatemono, adr_sonota, tel, tel_mobile, fax, mail,  mem, dsp_flg'
      )
      .eq('koenbasho_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const locDetails: LocsMasterDialogValues = {
        locNam: data.koenbasho_nam,
        adrPost: data.adr_post,
        adrShozai: data.adr_shozai,
        adrTatemono: data.adr_tatemono,
        adrSonota: data.adr_sonota,
        tel: data.tel,
        fax: data.fax,
        mem: data.mem,
        kana: data.kana,
        dspFlg: Boolean(data.dsp_flg),
        telMobile: data.tel_mobile,
        delFlg: Boolean(data.del_flg),
      };
      console.log(locDetails.delFlg);
      return locDetails;
    } else {
      console.error('公演場所情報取得エラー。', { message: error.message, code: error.code });
      return emptyLoc;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyLoc;
  }
};

/**
 * 公演場所マスタに新規登録する関数
 * @param data フォームで取得した公演場所情報
 */
export const addNewLoc = async (data: LocsMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_koenbasho (
        koenbasho_id, koenbasho_nam, kana, del_flg, dsp_ord_num,
        adr_post, adr_shozai, adr_tatemono, adr_sonota,
        tel, tel_mobile, fax, mail,
        mem, dsp_flg, add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(koenbasho_id),0) + 1 FROM m_koenbasho),
        $1, $2, $3,
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_koenbasho),
        $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
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
      data.locNam,
      data.kana,
      Number(data.delFlg),
      data.adrPost,
      data.adrShozai,
      data.adrTatemono,
      data.adrSonota,
      data.tel,
      data.telMobile,
      data.fax,
      data.mail,
      data.mem,
      Number(data.dspFlg),
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
  await revalidatePath('/locations-master');
};

/**
 * 公演場所マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する公演場所マスタID
 */
export const updateLoc = async (data: LocsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    koenbasho_nam: data.locNam,
    kana: data.kana,
    del_flg: Number(data.delFlg),
    adr_post: data.adrPost,
    adr_shozai: data.adrShozai,
    adr_tatemono: data.adrTatemono,
    adr_sonota: data.adrSonota,
    tel: data.tel,
    tel_mobile: data.telMobile,
    fax: data.fax,
    mail: data.mail,
    mem: data.mem,
    dsp_flg: Number(data.dspFlg),
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
  console.log(theData.koenbasho_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_koenbasho')
      .update({ ...theData })
      .eq('koenbasho_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('公演場所を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/locations-master');
};
