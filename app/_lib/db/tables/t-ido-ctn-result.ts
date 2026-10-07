'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../schema';

/**
 * 移動コンテナ実績削除（タグ指定）
 *
 * ★ 受注2列まで絞ること。同じ機材の別の公演で読まれた同じタグを巻き込まないため。
 *   受注2列は非キー列だが、DELETE の WHERE には必ず含めるのが出庫側の作法。
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @param kizaiId 機材id
 * @param juchuHeadId 受注ヘッダーid（予定外に読まれたタグは0）
 * @param juchuKizaiHeadId 受注機材ヘッダーid（予定外に読まれたタグは0）
 * @param rfidTagIds 削除対象のタグid
 * @param connection
 */
export const deleteIdoCtnResult = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number,
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  rfidTagIds: string[],
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_ido_ctn_result
    WHERE
      sagyo_kbn_id = $1
      AND sagyo_siji_id = $2
      AND sagyo_den_dat = $3
      AND sagyo_id = $4
      AND kizai_id = $5
      AND juchu_head_id = $6
      AND juchu_kizai_head_id = $7
      AND rfid_tag_id = ANY($8)
  `;

  const values = [sagyoKbnId, sagyoSijiId, sagyoDenDat, sagyoId, kizaiId, juchuHeadId, juchuKizaiHeadId, rfidTagIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw new Error('[deleteIdoCtnResult] DBエラー:', { cause: e });
  }
};
