'use server';

import { fakeToNull } from '@/app/(main)/(masters)/_lib/value-converters';
import { EqptsMasterDialogValues } from '@/app/(main)/(masters)/eqpt-master/_lib/types';

import pool from '../postgres';
import { SCHEMA } from '../supabase';

/**
 * 機材履歴マスタに挿入する関数
 * @param data 更新前の機材データ
 * @param id 更新された機材の機材ID
 */
export const insertEqptHistory = async (data: EqptsMasterDialogValues, id: number) => {
  const query = `
          INSERT INTO ${SCHEMA}.m_kizai_his (
            kizai_id_his_num, kizai_id, kizai_nam, del_flg, section_num, shozoku_id,
            bld_cod, tana_cod, eda_cod, kizai_grp_cod, dsp_ord_num, mem,
            bumon_id, shukei_bumon_id, dsp_flg, ctn_flg, def_dat_qty,
            reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, add_user, add_dat, upd_user, upd_dat
            
          )
          VALUES (
            (SELECT coalesce(max(kizai_id_his_num),0) + 1 FROM ${SCHEMA}.m_kizai_his),
            $1, $2, $3, $4, $5, $6, $7, $8, $9,
            $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
          );
        `;
  const values = [
    id,
    data.kizaiNam,
    Number(data.delFlg),
    data.sectionNum,
    fakeToNull(data.shozokuId),
    data.bldCod,
    data.tanaCod,
    data.edaCod,
    data.kizaiGrpCod,
    data.dspOrdNum,
    data.mem,
    fakeToNull(data.bumonId),
    fakeToNull(data.shukeibumonId),
    Number(data.dspFlg),
    Number(data.ctnFlg),
    data.defDatQty,
    data.regAmt,
    data.rankAmt1,
    data.rankAmt2,
    data.rankAmt3,
    data.rankAmt4,
    data.rankAmt5,
    data.addUser,
    data.addDat,
    data.updUser,
    data.updDat,
  ];
  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};
