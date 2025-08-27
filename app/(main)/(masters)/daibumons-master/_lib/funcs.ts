'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyDaibumon } from './datas';
import { DaibumonsMasterDialogValues, DaibumonsMasterTableValues } from './types';

/**
 * 大部門マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<DaibumonsMasterTableValues[]>} 大部門マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredDaibumons = async (query: string) => {
  const builder = supabase
    .schema('dev2')
    .from('m_dai_bumon')
    .select('dai_bumon_id, dai_bumon_nam,  mem, del_flg') // テーブルに表示するカラム
    .order('dsp_ord_num'); // 並び順

  if (query && query.trim() !== '') {
    builder.ilike('dai_bumon_nam', `%${query}%`);
  }

  try {
    const { data, error } = await builder;
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filtereddaibumons: DaibumonsMasterTableValues[] = data.map((d, index) => ({
          daibumonId: d.dai_bumon_id,
          daibumonNam: d.dai_bumon_nam,
          mem: d.mem,
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
        }));
        console.log(filtereddaibumons.length);
        return filtereddaibumons;
      }
    } else {
      console.error('大部門情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/daibumons-master');
};

/**
 * 選択された大部門のデータを取得する関数
 * @param id 大部門マスタID
 * @returns {Promise<daibumonsMasterDialogValues>} - 大部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneDaibumon = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_dai_bumon')
      .select('dai_bumon_nam, del_flg, mem')
      .eq('dai_bumon_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const daibumonDetails: DaibumonsMasterDialogValues = {
        daibumonNam: data.dai_bumon_nam,
        delFlg: Boolean(data.del_flg),
        mem: data.mem,
      };
      console.log(daibumonDetails.delFlg);
      return daibumonDetails;
    } else {
      console.error('大部門情報取得エラー。', { message: error.message, code: error.code });
      return emptyDaibumon;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyDaibumon;
  }
};

/**
 * 大部門マスタに新規登録する関数
 * @param data フォームで取得した大部門情報
 */
export const addNewDaibumon = async (data: DaibumonsMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_dai_bumon (
        dai_bumon_id, dai_bumon_nam, del_flg, dsp_ord_num,
        mem, add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(dai_bumon_id),0) + 1 FROM m_dai_bumon),
        $1, $2,
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_dai_bumon),
        $3, $4, $5, $6, $7
      );
    `;

  const date = toJapanTimeString(new Date());

  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);

    await pool.query(query, [data.daibumonNam, Number(data.delFlg), data.mem, date, 'shigasan', null, null]);
    console.log('data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/daibumons-master');
};

/**
 * 大部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する大部門マスタID
 */
export const updateDaibumon = async (data: DaibumonsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    dai_bumon_nam: data.daibumonNam,
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
  console.log(theData.dai_bumon_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_dai_bumon')
      .update({ ...theData })
      .eq('dai_bumon_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('大部門を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/daibumon-master');
};
