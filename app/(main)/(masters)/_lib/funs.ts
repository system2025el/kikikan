'use server';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectActiveDaibumons } from '@/app/_lib/db/tables/m-daibumon';
import { selectActiveShozokus } from '@/app/_lib/db/tables/m-shozoku';
import { selectActiveShukeibumons } from '@/app/_lib/db/tables/m-shukeibumon';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

/**
 * 選択肢に使う大部門リストを取得する関数
 * @returns {SelectTypes[]} 大部門のidと大部門名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getDaibumonsSelection = async () => {
  try {
    const { data, error } = await selectActiveDaibumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型する
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.dai_bumon_id,
      label: d.dai_bumon_nam,
    }));
    console.log('大部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う集計部門リストを取得する関数
 * @returns {SelectTypes[]} 集計部門のidと集計部門名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getShukeibumonsSelection = async () => {
  try {
    const { data, error } = await selectActiveShukeibumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.shukei_bumon_id,
      label: d.shukei_bumon_nam,
    }));
    console.log('集計部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う部門リストを取得する関数
 * @returns {SelectTypes[]} 部門のidと部門名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getBumonsSelection = async () => {
  try {
    const { data, error } = await selectActiveBumons();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.bumon_id,
      label: d.bumon_nam,
    }));
    console.log('部門が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択肢に使う所属リストを取得する関数
 * @returns {SelectTypes[]} 所属のidと所属名のlabelを持ったオブジェクトの配列、エラーの場合空配列
 */
export const getShozokuSelection = async () => {
  try {
    const { data, error } = await selectActiveShozokus();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.shozoku_id,
      label: d.shozoku_nam,
    }));
    console.log('所属', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 全選択肢をまとめて取得する関数
 * @returns {{SelectTypes[]}} 0:大部門, 1:集計部門, 2:部門, 3:所属
 */
export const getAllSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
  b: SelectTypes[];
  shozoku: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons, bumons, shozoku] = await Promise.all([
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
      getBumonsSelection(),
      getShozokuSelection(),
    ]);
    return { d: daibumons!, s: shukeibumons!, b: bumons!, shozoku: shozoku! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [], b: [], shozoku: [] };
  }
};

/**
 * 全部門の選択肢をまとめて取得する関数
 * @returns {{SelectTypes[]}} d:大部門, s:集計部門, b:部門
 */
export const getAllBumonSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
  b: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons, bumons] = await Promise.all([
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
      getBumonsSelection(),
    ]);

    return { d: daibumons!, s: shukeibumons!, b: bumons! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [], b: [] };
  }
};

/**
 * 大部門と集計部門の選択肢をまとめて取得する関数
 * @returns {{SelectTypes[]}} d:大部門, s:集計部門
 */
export const getAllBumonDSSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons] = await Promise.all([getDaibumonsSelection(), getShukeibumonsSelection()]);

    return { d: daibumons!, s: shukeibumons! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [] };
  }
};

/**
 * 機材選択で使う部門リストを取得する関数
 * @returns 無効化フラグなし、表示順部門の配列
 */
export const getBumonsForEqptSelection = async () => {
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('m_bumon')
      .select('bumon_id, bumon_nam')
      .neq('del_flg', 1)
      .order('dsp_ord_num');
    if (!error) {
      if (!data || data.length === 0) {
        return [];
      } else {
        const selectElements = data.map((d, index) => ({
          id: d.bumon_id,
          label: d.bumon_nam,
          tblDspNum: index,
        }));
        console.log('部門が', selectElements.length, '件');
        return selectElements;
      }
    } else {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選ばれた機材に対するセットオプションを確認する関数
 * @param idList 選ばれた機材たちの機材IDリスト
 * @returns セットオプションの機材の配列、もともと選ばれていたり、なかった場合はから配列を返す
 */
export const CheckSetoptions = async (idList: number[]) => {
  // 選ばれた機材たちのIDのリストをカンマ区切りの文字列にする
  const idListString = idList.join(',');
  try {
    await pool.query(` SET search_path TO dev2;`);
    const setIdList = await pool.query(
      `
      SELECT
        kizai_id
      FROM
        m_kizai_set
      WHERE
        set_kizai_id IN (${idListString})
      GROUP BY
        kizai_id
      `
    );
    console.log('setIdList : ', setIdList.rows);
    const setIdListArray = setIdList.rows.map((l) => l.kizai_id).filter((kizai_id) => !idList.includes(kizai_id));
    console.log('setIdListArray : ', setIdListArray);
    // セットオプションリストが空なら空配列を返して終了
    if (setIdListArray.length === 0) return [];
    const idListArrayString = setIdListArray.join(',');
    const data = await pool.query(
      `
      SELECT
        k.kizai_id as "kizaiId",
        k.kizai_nam as "kizaiNam",
        s.shozoku_nam as "shozokuNam",
        k.bumon_id as "bumonId",
        k.kizai_grp_cod as "kizaiGrpCod"
      FROM
        dev2.m_kizai as k
      INNER JOIN
        dev2.m_shozoku as s
      ON
        k.shozoku_id = s.shozoku_id
      WHERE
        k.del_flg <> 1
        AND k.dsp_flg <> 0
        AND k.kizai_id IN (${idListArrayString})
      ORDER BY
        k.kizai_grp_cod,
        k.dsp_ord_num;
      `
    );
    console.log('set options : ', data.rows);
    if (data && data.rows) {
      return data.rows;
    }
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/* 選択肢に使う顧客リスト */
export const getCustomerSelection = async (): Promise<{ kokyakuId: number; kokyakuNam: string }[]> => {
  try {
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .select('kokyaku_id, kokyaku_nam')
      .neq('dsp_flg', 0)
      .neq('del_flg', 1);

    if (!error) {
      if (!data || data.length === 0) {
        return [];
      } else {
        const selectElements = data.map((d) => ({
          kokyakuId: d.kokyaku_id,
          kokyakuNam: d.kokyaku_nam,
        }));
        console.log('顧客が', selectElements.length, '件');
        return selectElements;
      }
    } else {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      return [];
    }
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};
