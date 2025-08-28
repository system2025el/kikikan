'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyVeh } from './datas';
import { VehsMasterDialogValues, VehsMasterTableValues } from './types';

/**
 * 車両マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<VehsMasterTableValues[]>} 車両マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredVehs = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .select('sharyo_id, sharyo_nam, mem, dsp_flg, del_flg') // テーブルに表示するカラム
      .order('dsp_ord_num'); // 並び順
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredVehs: VehsMasterTableValues[] = data.map((d, index) => ({
          sharyoId: d.sharyo_id,
          sharyoNam: d.sharyo_nam,
          mem: d.mem,
          dspFlg: Boolean(d.dsp_flg),
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
        }));
        console.log(filteredVehs.length, '行');
        return filteredVehs;
      }
    } else {
      console.error('車両情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/vehicles-master');
};

/**
 * 選択された車両のデータを取得する関数
 * @param id 車両マスタID
 * @returns {Promise<VehsMasterDialogValues>} - 車両の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneVeh = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .select('sharyo_nam, mem, del_flg, dsp_flg')
      .eq('sharyo_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const VehDetails: VehsMasterDialogValues = {
        sharyoNam: data.sharyo_nam,
        mem: data.mem,
        dspFlg: Boolean(data.dsp_flg),
        delFlg: Boolean(data.del_flg),
      };
      console.log(VehDetails.delFlg);
      return VehDetails;
    } else {
      console.error('車両情報取得エラー。', { message: error.message, code: error.code });
      return emptyVeh;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyVeh;
  }
};

/**
 * 車両マスタに新規登録する関数
 * @param data フォームで取得した車両情報
 */
export const addNewVeh = async (data: VehsMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_sharyo (
        sharyo_id, sharyo_nam, del_flg, dsp_ord_num,
        mem, dsp_flg, add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(sharyo_id),0) + 1 FROM m_sharyo),
        $1, $2, 
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_sharyo),
        $3, $4, $5, $6, $7, $8
      );
    `;

  const date = toJapanTimeString();
  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);

    await pool.query(query, [
      data.sharyoNam,
      Number(data.delFlg),
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
  await revalidatePath('/vehicles-master');
};

/**
 * 車両マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する車両マスタID
 */
export const updateVeh = async (data: VehsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    sharyo_nam: data.sharyoNam,
    del_flg: Number(data.delFlg),
    mem: data.mem,
    dsp_flg: Number(data.dspFlg),
  };
  console.log(missingData.del_flg);
  const date = toJapanTimeString();

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.sharyo_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_sharyo')
      .update({ ...theData })
      .eq('sharyo_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('車両を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/vehicles-master');
};
