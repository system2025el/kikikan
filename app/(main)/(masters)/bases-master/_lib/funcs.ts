'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyBase } from './datas';
import { BasesMasterDialogValues, BasesMasterTableValues } from './types';

/**
 * 所属マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<BasesMasterTableValues[]>} 所属マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredBases = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_shozoku')
      .select('shozoku_id, shozoku_nam, mem, del_flg') // テーブルに表示するカラム
      // 検索、所属名 いらない気もするdelete
      //   .or(`shozoku_nam.ilike.%${query}%,`)
      .order('dsp_ord_num'); // 並び順
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredBases: BasesMasterTableValues[] = data.map((d, index) => ({
          shozokuId: d.shozoku_id,
          shozokuNam: d.shozoku_nam,
          mem: d.mem,
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
        }));
        console.log(filteredBases.length, '行');
        return filteredBases;
      }
    } else {
      console.error('所属情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/bases-master');
};

/**
 * 選択された所属のデータを取得する関数
 * @param id 所属マスタID
 * @returns {Promise<BasesMasterDialogValues>} - 所属の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneBase = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_shozoku')
      .select('shozoku_nam, mem, del_flg')
      .eq('shozoku_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const BaseDetails: BasesMasterDialogValues = {
        shozokuNam: data.shozoku_nam,
        mem: data.mem,
        delFlg: Boolean(data.del_flg),
      };
      console.log(BaseDetails.delFlg);
      return BaseDetails;
    } else {
      console.error('所属情報取得エラー。', { message: error.message, code: error.code });
      return emptyBase;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyBase;
  }
};

/**
 * 所属マスタに新規登録する関数
 * @param data フォームで取得した所属情報
 */
export const addNewBase = async (data: BasesMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_shozoku (
        shozoku_id, shozoku_nam, del_flg, dsp_ord_num,
        mem, add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(shozoku_id),0) + 1 FROM m_shozoku),
        $1, $2, 
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_shozoku),
        $3, $4, $5, $6, $7
      );
    `;

  const date = toJapanTimeString(new Date());

  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);

    await pool.query(query, [data.shozokuNam, Number(data.delFlg), data.mem, date, 'shigasan', null, null]);
    console.log('data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/bases-master');
};

/**
 * 所属マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する所属マスタID
 */
export const updateBase = async (data: BasesMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    shozoku_nam: data.shozokuNam,
    del_flg: Number(data.delFlg),
    mem: data.mem,
  };
  console.log(missingData.del_flg);
  const date = toJapanTimeString(new Date());

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.shozoku_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_shozoku')
      .update({ ...theData })
      .eq('shozoku_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('所属を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/bases-master');
};
