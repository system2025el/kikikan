'use server';

import { PoolClient } from 'pg';

import { NYUSHUKO_SHUBETU_ID, SAGYO_KBN_ID } from '@/app/_lib/constants';
import { selectJuchuContainerMeisaiRowsTx } from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import { selectJuchuKizaiNyushukoBashoIdsTx } from '@/app/_lib/db/tables/t-juchu-kizai-nyushuko';
import { deleteNyukoCtnResult } from '@/app/_lib/db/tables/t-nyushuko-ctn-result';
import { deleteNyukoCtnDen, updateNyukoCtnDenPlanQty } from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectFixedSagyoIdsTx } from '@/app/_lib/db/tables/t-nyushuko-fix';

/**
 * 出庫場所からコンテナが無くなったあとに、そのコンテナの入庫伝票・入庫実績を合わせる（受注機材ヘッダー単位）
 * 出庫明細でコンテナを削除したとき・出発時に読取0で削除したとき・メイン受注機材明細で出庫場所をなくしたときに使う
 * 入庫伝票は出発時に作られるため、出発解除後の削除や、別の出庫場所が出発済みのときに古い数量が残らないようにする
 * - 入庫が2か所：削除した場所の入庫伝票・入庫実績を削除する（入庫場所＝出庫場所）
 * - 入庫が1か所：もう一方の出庫場所が出発済みで、そこにコンテナが残っていれば、入庫伝票の予定数をその場所の数量にする。
 *   残っていなければ入庫伝票・入庫実績を削除する（未出発の場所の分は、その場所の出発時に作られる）
 * - 到着済み（入庫確定がある）のヘッダーには触らない
 * ※受注コンテナ明細（その場所の行）を削除した後に呼ぶこと
 * @param rows 削除したコンテナ（受注ヘッダーid、受注機材ヘッダーid、受注機材明細id、機材id）
 * @param shukoBashoId 削除した出庫場所id
 * @param userNam ユーザー名
 * @param connection
 */
export const syncNyukoCtnAfterDelete = async (
  rows: { juchuHeadId: number; juchuKizaiHeadId: number; juchuKizaiMeisaiId: number; kizaiId: number }[],
  shukoBashoId: number,
  userNam: string,
  connection: PoolClient
) => {
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.juchuHeadId}-${r.juchuKizaiHeadId}`;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }

  for (const group of groups.values()) {
    const { juchuHeadId, juchuKizaiHeadId } = group[0];

    const arrivedBashoIds = await selectFixedSagyoIdsTx(
      juchuHeadId,
      juchuKizaiHeadId,
      SAGYO_KBN_ID.nyukoConfirmed,
      connection
    );
    if (arrivedBashoIds.length > 0) continue;

    const nyukoBashoIds = await selectJuchuKizaiNyushukoBashoIdsTx(
      juchuHeadId,
      juchuKizaiHeadId,
      NYUSHUKO_SHUBETU_ID.nyuko,
      connection
    );
    if (nyukoBashoIds.length === 0) continue;

    // 入庫が2か所：削除した場所の入庫伝票・入庫実績を消す
    if (nyukoBashoIds.length >= 2) {
      const targets = group.map((r) => ({
        juchuKizaiMeisaiId: r.juchuKizaiMeisaiId,
        kizaiId: r.kizaiId,
        sagyoId: shukoBashoId,
      }));
      await deleteNyukoCtnDen(juchuHeadId, juchuKizaiHeadId, targets, connection);
      await deleteNyukoCtnResult(juchuHeadId, juchuKizaiHeadId, targets, connection);
      continue;
    }

    // 入庫が1か所：残っている出発済みの出庫場所の数量だけにする
    const nyukoBashoId = nyukoBashoIds[0];
    const departedBashoIds = await selectFixedSagyoIdsTx(
      juchuHeadId,
      juchuKizaiHeadId,
      SAGYO_KBN_ID.shukoConfirmed,
      connection
    );
    const ctnRows = await selectJuchuContainerMeisaiRowsTx(juchuHeadId, juchuKizaiHeadId, connection);
    const delTargets: { juchuKizaiMeisaiId: number; kizaiId: number; sagyoId: number }[] = [];
    for (const r of group) {
      const remaining = ctnRows.filter(
        (c) =>
          c.juchu_kizai_meisai_id === r.juchuKizaiMeisaiId &&
          c.kizai_id === r.kizaiId &&
          c.shozoku_id !== shukoBashoId &&
          departedBashoIds.includes(c.shozoku_id)
      );
      if (remaining.length > 0) {
        const planQty = remaining.reduce((sum, c) => sum + (c.plan_kizai_qty ?? 0), 0);
        await updateNyukoCtnDenPlanQty(
          juchuHeadId,
          juchuKizaiHeadId,
          r.juchuKizaiMeisaiId,
          r.kizaiId,
          nyukoBashoId,
          planQty,
          userNam,
          connection
        );
      } else {
        delTargets.push({ juchuKizaiMeisaiId: r.juchuKizaiMeisaiId, kizaiId: r.kizaiId, sagyoId: nyukoBashoId });
      }
    }
    await deleteNyukoCtnDen(juchuHeadId, juchuKizaiHeadId, delTargets, connection);
    await deleteNyukoCtnResult(juchuHeadId, juchuKizaiHeadId, delTargets, connection);
  }
};
