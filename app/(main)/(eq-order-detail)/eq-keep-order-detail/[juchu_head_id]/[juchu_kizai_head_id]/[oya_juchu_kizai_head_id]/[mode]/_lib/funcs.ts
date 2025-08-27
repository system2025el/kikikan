'use server';

import { QueryResult } from 'pg';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';
import { GetJuchuKizaiNyushuko } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './types';

/**
 * 受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const GetKeepJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data: juchuKizaiHead, error: juchuKizaiHeadError } = await supabase
      .schema('dev2')
      .from('t_juchu_kizai_head')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, juchu_honbanbi_qty, nebiki_amt, mem, head_nam')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
    if (juchuKizaiHeadError) {
      console.error('GetEqHeader juchuKizaiHead error : ', juchuKizaiHeadError);
      return null;
    }

    const juchuDate = await GetJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    const keepJucuKizaiHeadData: KeepJuchuKizaiHeadValues = {
      juchuHeadId: juchuKizaiHead.juchu_head_id,
      juchuKizaiHeadId: juchuKizaiHead.juchu_kizai_head_id,
      juchuKizaiHeadKbn: juchuKizaiHead.juchu_kizai_head_kbn,
      mem: juchuKizaiHead.mem ? juchuKizaiHead.mem : '',
      headNam: juchuKizaiHead.head_nam,
      kicsShukoDat: juchuDate && juchuDate.kicsShukoDat,
      kicsNyukoDat: juchuDate && juchuDate.kicsNyukoDat,
      yardShukoDat: juchuDate && juchuDate.yardShukoDat,
      yardNyukoDat: juchuDate && juchuDate.yardNyukoDat,
    };

    console.log('keepJucuKizaiHeadData', keepJucuKizaiHeadData);
    return keepJucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};

export const GetKeepJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('v_juchu_kizai_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, shozoku_id, shozoku_nam, mem, kizai_id, kizai_nam, plan_kizai_qty, plan_yobi_qty, keep_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
    if (error) {
      console.error('GetKeeoEqList eqList error : ', error);
      return [];
    }

    const keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      oyaPlanKizaiQty: d.plan_kizai_qty,
      oyaPlanYobiQty: d.plan_yobi_qty,
      plankeepQty: d.keep_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return keepJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
  }
};
