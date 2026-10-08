'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

/**
 * 移動伝票取得（受注機材ヘッダー単位）
 *
 * 1行 = 1受注機材ヘッダー。同じ機材が複数の公演に紐づく場合は行が分かれる。
 * 受注に紐づかない手動追加の機材は juchu_head_id = 0 の1行だけ。
 *
 * 並びはビュー側でも同じ順序を持っているが、PostgREST の挙動に依存したくないので
 * ここでも明示する。この順序は読取タグの充当順と一致していなければならない
 * （見る場所によって「どの明細が完了か」が食い違うため）。
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const selectIdoDen = async (sagyoKbnId: number, sagyoSijiId: number, sagyoDenDat: string, sagyoId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_lst')
      .select(
        'ido_flg, juchu_flg, juchu_head_id, juchu_kizai_head_id, koen_nam, head_nam, kizai_id, kizai_nam, kizai_shozoku_id, rfid_yard_qty, rfid_kics_qty, plan_juchu_qty, plan_qty, result_qty, result_adj_qty, diff_qty, ctn_flg'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId)
      .order('kizai_grp_cod', { nullsFirst: false })
      .order('dsp_ord_num', { nullsFirst: false })
      .order('kizai_id')
      .order('juchu_head_id')
      .order('juchu_kizai_head_id');
  } catch (e) {
    throw new Error('[selectIdoDen] DBエラー:', { cause: e });
  }
};

/**
 * 移動伝票1件取得（機材詳細画面のヘッダー用）
 *
 * ★ 受注2列まで指定して初めて1行に決まる。機材idだけでは複数明細ぶんヒットして
 *   .single() が PGRST116 で落ちる。
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @param kizaiId 機材id
 * @param juchuHeadId 受注ヘッダーid（手動追加行は0）
 * @param juchuKizaiHeadId 受注機材ヘッダーid（手動追加行は0）
 */
export const selectIdoDenOne = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  juchuHeadId: number,
  juchuKizaiHeadId: number
) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_lst')
      .select(
        'kizai_id, kizai_nam, plan_qty, result_qty, result_adj_qty, ctn_flg, bld_cod, tana_cod, eda_cod, kizai_mem, juchu_head_id, juchu_kizai_head_id, koen_nam, head_nam'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId)
      .eq('kizai_id', kizaiId)
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectIdoDenOne] DBエラー:', { cause: e });
  }
};

/**
 * 移動伝票確認
 *
 * 保存時に「この明細の伝票が既にあるか」を見て追加か更新かを分ける。
 * 受注2列まで含めないと、同じ機材の別明細を自分の行と誤認して UPDATE に回ってしまう。
 * @param sagyoKbnId
 * @param sagyoSijiId
 * @param sagyoDenDat
 * @param sagyoId
 * @param kizaiId
 * @param juchuHeadId
 * @param juchuKizaiHeadId
 * @param connection
 * @returns
 */
export const selectConfirmIdoDen = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      ido_den_id
    FROM
      ${SCHEMA}.t_ido_den
    WHERE
      sagyo_kbn_id = $1
      AND sagyo_siji_id = $2
      AND sagyo_den_dat = $3
      AND sagyo_id = $4
      AND kizai_id = $5
      AND juchu_head_id = $6
      AND juchu_kizai_head_id = $7
  `;

  const values = [sagyoKbnId, sagyoSijiId, sagyoDenDat, sagyoId, kizaiId, juchuHeadId, juchuKizaiHeadId];

  try {
    const result = await connection.query(query, values);
    return result.rows;
  } catch (e) {
    throw new Error('[selectConfirmIdoDen] DBエラー:', { cause: e });
  }
};

/**
 * 機材の移動伝票id取得
 *
 * 移動伝票idは機材単位で1つ（同じ機材の明細行は同じidを共有する）。
 * 新しい明細を追加するとき、その機材に既に伝票があるならそのidを使い回す必要がある。
 * ゲートが v_ido_den2_lst から読んだ ido_den_id を実績送信で送り返してくるため、
 * 1機材に複数のidができると読取が伝票に紐づかなくなる。
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param kizaiId 機材id
 * @param connection
 * @returns 既存の移動伝票id。無ければ null
 */
export const selectIdoDenIdByKizai = async (
  sagyoSijiId: number,
  sagyoDenDat: string,
  kizaiId: number,
  connection: PoolClient
) => {
  const query = `
    SELECT
      ido_den_id
    FROM
      ${SCHEMA}.t_ido_den
    WHERE
      sagyo_siji_id = $1
      AND sagyo_den_dat = $2
      AND kizai_id = $3
    LIMIT 1
  `;

  try {
    const result = await connection.query(query, [sagyoSijiId, sagyoDenDat, kizaiId]);
    return result.rows.length > 0 ? (result.rows[0].ido_den_id as number) : null;
  } catch (e) {
    throw new Error('[selectIdoDenIdByKizai] DBエラー:', { cause: e });
  }
};
