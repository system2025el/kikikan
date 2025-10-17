'use server';

import { PoolClient } from 'pg';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { RfidsMasterDialogValues } from '@/app/(main)/(masters)/rfid-master/[kizaiId]/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MRfidDBValues } from '../types/m-rfid-type';

/**
 * 機材IDが一致するRFIDタグの数を返す
 * @param id kizai_id
 * @returns
 */
export const selectCountOfTheEqpt = async (id: number) => {
  try {
    return await supabase.schema(SCHEMA).from('m_rfid').select('*', { count: 'exact', head: true }).eq('kizai_id', id);
  } catch (e) {
    throw e;
  }
};
/**
 * 機材IDが一致する有効ではないRFIDのタグの数を返す
 * @param id kizai_id
 * @returns
 */
export const selectCountOfTheNgEqpt = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_rfid')
      .select('*', { count: 'exact', head: true })
      .eq('kizai_id', id)
      .gte('rfid_kizai_sts', 100);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材表エクセルに表示するすべての情報
 * @returns {{}[]}機材・RFID・部門・大部門・集計部門マスタから取得した情報
 */
export const selectAllRfidWithKizai = async () => {
  const query = `
  SELECT
    mr.rfid_tag_id, 
    mr.rfid_kizai_sts, 
    mr.del_flg, 
    mk.section_num, 
    mk.kizai_nam, 
    mr.el_num, 
    mr.shozoku_id,
    mk.bld_cod, 
    mk.tana_cod, 
    mk.eda_cod, 
    mk.kizai_grp_cod, 
    mk.dsp_ord_num, 
    mr.mem, 
    md.dai_bumon_nam, 
    mb.bumon_nam, 
    ms.shukei_bumon_nam,
    mk.dsp_flg, 
    mk.ctn_flg, 
    mk.def_dat_qty, 
    mk.reg_amt, 
    mk.rank_amt_1, 
    mk.rank_amt_2, 
    mk.rank_amt_3, 
    mk.rank_amt_4, 
    mk.rank_amt_5 
  FROM ${SCHEMA}.m_rfid AS mr
  LEFT JOIN ${SCHEMA}.m_kizai AS mk ON mr.kizai_id = mk.kizai_id
  LEFT JOIN ${SCHEMA}.m_bumon AS mb ON mk.bumon_id = mb.bumon_id
  LEFT JOIN ${SCHEMA}.m_dai_bumon AS md ON mb.dai_bumon_id = md.dai_bumon_id
  LEFT JOIN ${SCHEMA}.m_shukei_bumon AS ms ON mk.shukei_bumon_id = ms.shukei_bumon_id
  ORDER BY mr.rfid_tag_id
`;
  try {
    return await pool.query(query);
  } catch (e) {
    throw e;
  }
};

/**
 * タグIDが一致するRFIDタグの情報を取得する関数
 * @param id RFIDタグID
 * @returns {{}}
 */
export const selectOneRfid = async (id: string) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_rfid')
      .select('rfid_tag_id, el_num, shozoku_id, rfid_kizai_sts, mem, del_flg')
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
      shozoku.shozoku_nam,
      r.mem,
      r.rfid_kizai_sts,
      sts.sts_nam,
      r.del_flg,
      r.el_num
    FROM
      ${SCHEMA}.m_rfid as r
    LEFT JOIN
      ${SCHEMA}.m_shozoku as shozoku
    ON r.shozoku_id = shozoku.shozoku_id
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
 * 変更があるRFIDマスタの更新をする関数
 * @param data ステータスが変わったRFIDタグリスト
 */
export const updateRfidTagStsDB = async (data: { rfid_tag_id: string; rfid_kizai_sts: number }[], user: string) => {
  const updDat = toJapanTimeString(undefined, '-');
  const updatePlaceholders = data
    .map((_, index) => {
      const start = index * 2 + 1;
      return `($${start}, $${start + 1})`;
    })
    .join(',');
  const updateValues = data.flatMap((v) => [v.rfid_tag_id, v.rfid_kizai_sts]);
  const query = `
          UPDATE ${SCHEMA}.m_rfid AS mr
          SET
            rfid_kizai_sts = d.rfid_kizai_sts::integer,
            upd_dat = $${updateValues.length + 1}::timestamp,
            upd_user = $${updateValues.length + 2}
          FROM (
            VALUES ${updatePlaceholders}
          ) AS d(rfid_tag_id, rfid_kizai_sts)
          WHERE mr.rfid_tag_id = d.rfid_tag_id;
        `;

  try {
    await pool.query(query, [...updateValues, updDat, user]);
  } catch (e) {
    throw e;
  }
};

/**
 * RFIDマスタ新規登録
 * @param {MRfidDBValues} data
 */
export const insertNewRfid = async (data: MRfidDBValues, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const query = `INSERT INTO ${SCHEMA}.m_rfid (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * RFIDマスタ更新
 * @param {MRfidDBValues} data
 */
export const upDateRfidDB = async (data: MRfidDBValues, connection: PoolClient) => {
  const { rfid_tag_id, ...rest } = data;
  // 準備
  const cols = Object.keys(rest);
  const values = Object.values(rest);
  // SET句
  const setClause = cols.map((key, i) => `${key} = $${i + 1}`).join(', ');

  const query = `UPDATE ${SCHEMA}.m_rfid SET ${setClause} WHERE rfid_tag_id = $${cols.length + 1}`;

  try {
    await connection.query(query, [...values, data.rfid_tag_id]);
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
  const builder = supabase.schema(SCHEMA).from('m_rfid').select('*').eq('el_num', elNum).maybeSingle();
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
