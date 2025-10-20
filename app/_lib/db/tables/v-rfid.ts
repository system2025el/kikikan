'use server';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * タグIDが一致するRFIDタグの情報を取得する関数
 * @param id RFIDタグID
 * @returns {{}}
 */
export const selectOneRfid = async (id: string) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_rfid')
      .select('rfid_tag_id, el_num, mem, del_flg, shozoku_id, rfid_kizai_sts')
      .eq('rfid_tag_id', id)
      .maybeSingle();
  } catch (e) {
    throw e;
  }
};

/**
 * 機材IDが一致したRFIDタグ情報の配列を取得する関数
 * @param kizaiId kizai_id
 * @returns {{}[]}機材IDが一致したRFIDタグ情報の配列
 */
export const selectRfidsOfTheKizai = async (kizaiId: number) => {
  const query = `
    SELECT
      r.rfid_tag_id,
      r.mem,
      r.rfid_kizai_sts,
      sts.sts_nam,
      r.del_flg,
      r.el_num
    FROM
      ${SCHEMA}.v_rfid as r
    LEFT JOIN
      ${SCHEMA}.m_sagyo_sts as sts
    ON r.rfid_kizai_sts = sts.sts_id
    WHERE
      r.kizai_id = $1
    ORDER BY r.rfid_tag_id
  `;
  try {
    return await pool.query(query, [kizaiId]);
  } catch (e) {
    throw e;
  }
};

/**
 * elNumが一致するRFIDを取得する関数
 * @param {number} elNum el No. el_num
 * @returns {{}[]}
 */
export const selectElNumExists = async (elNum: number) => {
  const builder = supabase.schema(SCHEMA).from('v_rfid').select('*').eq('el_num', elNum).maybeSingle();
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
