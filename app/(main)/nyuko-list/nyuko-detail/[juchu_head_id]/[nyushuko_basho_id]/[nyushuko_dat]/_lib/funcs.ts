'use server';

import pool from '@/app/_lib/db/postgres';
import { selectChildJuchuKizaiHeadConfirm } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { updateNyushukoFix } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectShukoDetail } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { NyukoDetailTableValues } from './types';

/**
 * 入庫明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日
 * @returns
 */
export const getNyukoDetail = async (juchuHeadId: number, nyushukoBashoId: number, nyushukoDat: string) => {
  try {
    const { data, error } = await selectShukoDetail(juchuHeadId, nyushukoBashoId, nyushukoDat, 30);

    if (error) {
      console.error('getShukoDetail error : ', error);
      throw error;
    }

    const shukoDetailData: NyukoDetailTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadIdv: d.juchu_kizai_head_idv.split(',').map(Number),
      juchuKizaiHeadKbnv: Number(d.juchu_kizai_head_kbnv),
      headNamv: d.head_namv,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      kokyakuNam: d.kokyaku_nam,
      nyushukoBashoId: d.nyushuko_basho_id,
      nyushukoDat: d.nyushuko_dat,
      nyushukoShubetuId: d.nyushuko_shubetu_id,
      planQty: d.plan_qty,
      resultAdjQty: d.result_adj_qty,
      resultQty: d.result_qty,
      sagyoKbnId: d.sagyo_kbn_id,
      diff: (d.result_qty ?? 0) + (d.result_adj_qty ?? 0) - (d.plan_qty ?? 0),
      ctnFlg: d.ctn_flg,
    }));

    return shukoDetailData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 入庫作業確定フラグ更新
 * @param nyukoDetailData 入庫データ
 * @param sagyoFixFlg 作業確定フラグ
 * @param userNam ユーザー名
 * @returns
 */
export const updNyukoDetail = async (nyukoDetailData: NyukoDetailTableValues[], userNam: string) => {
  const connection = await pool.connect();

  if (nyukoDetailData.length === 0 || !nyukoDetailData[0].juchuKizaiHeadIdv) {
    console.error('No data to update');
    return;
  }

  const updateFixData: NyushukoFix[] = nyukoDetailData[0].juchuKizaiHeadIdv.map((id) => ({
    juchu_head_id: nyukoDetailData[0].juchuHeadId,
    juchu_kizai_head_id: id,
    sagyo_kbn_id: 70,
    sagyo_den_dat: nyukoDetailData[0].nyushukoDat,
    sagyo_id: nyukoDetailData[0].nyushukoBashoId,
    sagyo_fix_flg: 1,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  try {
    await connection.query('BEGIN');

    for (const data of updateFixData) {
      await updateNyushukoFix(data, connection);
      console.log('nyushuko fix sagyo_fix_flg updated successfully:', data);
    }

    await connection.query('COMMIT');
    return true;
  } catch (e) {
    console.error(e);
    await connection.query('ROLLBACK');
    return false;
  } finally {
    connection.release();
  }
};
