'use server';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

/**
 * 移動機材詳細のタグ一覧
 *
 * ★ 受注2列まで絞ること。絞らないと同じ機材の他の公演で読まれたタグまで並び、
 *   その画面で補正・削除すると別の公演の実績を触ってしまう。
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @param kizaiId 機材id
 * @param juchuHeadId 受注ヘッダーid（手動追加行は0）
 * @param juchuKizaiHeadId 受注機材ヘッダーid（手動追加行は0）
 */
export const selectIdoEqptDetail = async (
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
      .from('v_ido_den3_result')
      .select(
        'ido_den_id, rfid_el_num, rfid_tag_id, rfid_kizai_sts, rfid_sts_nam, rfid_mem, rfid_dat, rfid_user, rfid_del_flg'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId)
      .eq('kizai_id', kizaiId)
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
  } catch (e) {
    throw new Error('[selectIdoEqptDetail] DBエラー:', { cause: e });
  }
};
