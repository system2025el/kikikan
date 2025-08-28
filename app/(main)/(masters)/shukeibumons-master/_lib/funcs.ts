'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyShukeibumon } from './datas';
import { ShukeibumonsMasterDialogValues, ShukeibumonsMasterTableValues } from './types';

/**
 * 集計部門マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<ShukeibumonsMasterTableValues[]>} 集計部門マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredShukeibumons = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_shukei_bumon')
    .select('shukei_bumon_id, shukei_bumon_nam, mem, del_flg') // テーブルに表示するカラム
    .order('dsp_ord_num'); // 並び順

  if (query && query.trim() !== '') {
    builder.ilike('shukei_bumon_nam', `%${query}%`);
  }
  try {
    const { data, error } = await builder;
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredShukeibumons: ShukeibumonsMasterTableValues[] = data.map((d, index) => ({
          shukeibumonId: d.shukei_bumon_id,
          shukeibumonNam: d.shukei_bumon_nam,
          mem: d.mem,
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
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
      .schema(SCHEMA)
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

  const date = toJapanTimeString();
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
  const date = toJapanTimeString();

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.shukei_bumon_nam);

  try {
    const { error: updateError } = await supabase
      .schema(SCHEMA)
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
