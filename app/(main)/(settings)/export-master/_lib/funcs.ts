'use server';

import pool from '@/app/_lib/postgres/postgres';

export const getAllEqptAndRfid = async () => {
  try {
    await pool.query(`SET search_path TO dev5;`);

    const query = `
        SELECT
          mr.rfid_tag_id, 
          mr.rfid_kizai_sts, 
          mr.del_flg, 
          mk.section_num, 
          mk.kizai_nam, 
          mk.el_num, 
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
        FROM m_rfid AS mr
        LEFT JOIN m_kizai AS mk ON mr.kizai_id = mk.kizai_id
        LEFT JOIN m_bumon AS mb ON mk.bumon_id = mb.bumon_id
        LEFT JOIN m_dai_bumon AS md ON mk.dai_bumon_id = md.dai_bumon_id
        LEFT JOIN m_shukei_bumon AS ms ON mk.shukei_bumon_id = ms.shukei_bumon_id
        ORDER BY mr.rfid_tag_id
      `;

    const result = await pool.query(query);

    console.log('I got a datalist from db', result.rowCount);

    // データをAOAけいしきに
    if (result && result.rows) {
      const aoaData = result.rows.map((row) => [
        row.rfid_tag_id,
        row.rfid_kizai_sts,
        row.del_flg,
        row.section_nam,
        row.kizai_nam,
        row.el_num,
        row.shozoku_id,
        row.bld_cod,
        row.tana_cod,
        row.eda_cod,
        row.kizai_grp_cod,
        row.dsp_ord_num,
        row.mem,
        row.dai_bumon_nam,
        row.bumon_nam,
        row.shukei_bumon_nam,
        row.dsp_flg,
        row.ctn_flg,
        row.def_dat_qty,
        row.reg_amt,
        row.rank_amt_1,
        row.rank_amt_2,
        row.rank_amt_3,
        row.rank_amt_4,
        row.rank_amt_5,
      ]);
      return aoaData;
    }

    return [];
  } catch (e) {
    console.error('例外が発生', e);
    // エラーハンドリングのベストプラクティスとして、エラーをそのまま再スローする
    throw e;
  }
};
