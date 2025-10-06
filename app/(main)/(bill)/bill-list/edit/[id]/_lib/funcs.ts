'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';
import { updateBillHead } from '@/app/_lib/db/tables/t-seikyu-head';
import { deleteBillMeisai, insertBillMeisai, updateBillMeisai } from '@/app/_lib/db/tables/t-seikyu-meisai';
import {
  deleteBillMeisaiHeads,
  insertBillMeisaiHead,
  updateBillMeisaiHead,
} from '@/app/_lib/db/tables/t-seikyu-meisai-head';
import { SeikyuHead } from '@/app/_lib/db/types/t-seikyu-head-type';
import { SeikyuMeisai } from '@/app/_lib/db/types/t-seikyu-meisai-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { BillHeadValues } from '../../../_lib/types';

/**
 * 請求ヘッドを更新する関数
 * @param data 請求ヘッドのデータ
 * @returns 請求ヘッドID
 */
export const updateBill = async (data: BillHeadValues, user: string): Promise<number | null> => {
  /* トランザクション準備 */
  const connection = await pool.connect();
  // 請求明細ヘッド準備
  // 明細ヘッドIDと明細IDの発番
  const meisaiheadList = data.meisaiHeads.map((l) => ({
    ...l,
    seikyuMeisaiHeadId: l?.seikyuMeisaiHeadId ?? FAKE_NEW_ID,
    meisai: l?.meisai?.map((m) => ({
      ...m,
      id: m.id ?? FAKE_NEW_ID,
    })),
  }));
  const kokyakuId = await connection.query(
    `SELECT kokyaku_id from ${SCHEMA}.m_kokyaku WHERE kokyaku_nam = '${data.kokyaku}'`
  );

  // // 請求明細準備
  // const meisaiList = meisaiheadList.flatMap((l) =>
  //   l.meisai!.map((m) => ({
  //     ...m,
  //     seikyuMeisaiHeadId: l.seikyuMeisaiHeadId,
  //   }))
  // );

  // 請求ヘッド
  const billHead: SeikyuHead = {
    seikyu_head_id: data.seikyuHeadId!,
    seikyu_sts: data.seikyuSts,
    seikyu_dat: data.seikyuDat ? toJapanTimeString(data.seikyuDat, '-') : null,
    seikyu_head_nam: data.seikyuHeadNam,
    kokyaku_id: kokyakuId.rows[0].kokyaku_id ?? null,
    kokyaku_nam: data.kokyaku,
    nyuryoku_user: data.nyuryokuUser,
    zei_rat: data.zeiRat,
    upd_dat: toJapanTimeString(undefined, '-'),
    upd_user: user,
  };
  // 明細ヘッド
  console.log(`======================================${meisaiheadList}`);
  const meisaiHeads = meisaiheadList.map((l, index) => ({
    seikyu_head_id: data.seikyuHeadId!,
    seikyu_meisai_head_id: l.seikyuMeisaiHeadId,
    juchu_head_id: l.juchuHeadId,
    juchu_kizai_head_id: l.juchuKizaiHeadId,
    seikyu_str_dat: l.seikyuRange?.strt ? toJapanTimeString(l.seikyuRange.strt, '-') : null,
    seikyu_end_dat: l.seikyuRange?.end ? toJapanTimeString(l.seikyuRange.end, '-') : null,
    // seikyu_meisai_head_nam: l.seikyuMeisaiHeadNam ?? null, // あとで追加
    koen_nam: l.koenNam,
    koenbasho_nam: l.koenBashoNam,
    kokyaku_tanto_nam: l.kokyakuTantoNam,
    nebiki_amt: l.nebikiAmt ?? null,
    zei_flg: Number(l.zeiFlg),
    dsp_ord_num: index + 1,
    add_dat: toJapanTimeString(undefined, '-'),
    add_user: user,
    upd_dat: toJapanTimeString(undefined, '-'),
    upd_user: user,
    meisai: l.meisai?.map((m) => ({
      seikyu_head_id: data.seikyuHeadId!,
      seikyu_meisai_head_id: l.seikyuMeisaiHeadId,
      seikyu_meisai_id: m.id,
      seikyu_meisai_nam: m.nam ?? null,
      meisai_qty: m.qty ?? 0,
      meisai_honbanbi_qty: m.honbanbiQty ?? 0,
      meisai_tanka_amt: m.tankaAmt ?? 0,
      // shokei_amt: m.shokeiAmt ?? null,
      dsp_ord_num: index + 1,
      add_dat: toJapanTimeString(undefined, '-'),
      add_user: user,
      upd_dat: toJapanTimeString(undefined, '-'),
      upd_user: user,
    })),
  }));

  try {
    console.log('更新START');
    // トランザクション開始
    await connection.query('BEGIN');
    if (billHead) {
      // 請求ヘッダ更新処理
      await updateBillHead(billHead, connection);

      // 明細ヘッダ ------------------------------------------------
      // 明細ヘッドの最大IDを取得
      const headMaxIdResult = await connection.query(
        `SELECT MAX(seikyu_meisai_head_id) as max_id FROM ${SCHEMA}.t_seikyu_meisai_head WHERE seikyu_head_id = $1`,
        [data.seikyuHeadId]
      );
      let currentHeadMaxId = headMaxIdResult.rows[0].max_id || 0;

      // idがFAKE_NEW_IDなら新規の請求ヘッダ
      const insertMHeadList = meisaiHeads
        .filter((d) => d.seikyu_meisai_head_id === FAKE_NEW_ID)
        .map(({ upd_dat, upd_user, ...rest }) => rest)
        .map((h) => {
          currentHeadMaxId++;
          return {
            ...h, // ネストされた meisai 配列も維持
            seikyu_meisai_head_id: currentHeadMaxId, // 新しいID
          };
        });
      const updateMHeadList = meisaiHeads
        .filter((d) => d.seikyu_meisai_head_id !== FAKE_NEW_ID)
        .map(({ add_dat, add_user, ...rest }) => rest);

      // 請求ヘッダ新規挿入
      if (insertMHeadList.length > 0) {
        console.log('-------------------', insertMHeadList, '----------------------');
        // 新規処理実行
        await insertBillMeisaiHead(
          insertMHeadList.map(({ meisai, ...rest }) => rest),
          connection
        );
      }
      // 請求ヘッダ更新処理
      if (updateMHeadList.length > 0) {
        // 更新処理実行
        await updateBillMeisaiHead(
          updateMHeadList.map(({ meisai, ...rest }) => rest),
          connection
        );
      }

      // 明細 ------------------------------------------------
      // すべての採番済みの明細ヘッドリスト（明細込み）
      const allMeisaiHeads = [...insertMHeadList, ...updateMHeadList];

      // 明細ヘッダIDのリスト
      const headIds = allMeisaiHeads.map((p) => p.seikyu_meisai_head_id);
      // seikyu_meisai_head_idと最大seikyu_meisai_idのmap化
      const maxIdMap = new Map<number, number>();
      if (headIds.length > 0) {
        // 明細ヘッドごとの最大明細IDを取得
        const maxMeisaiIdQuery = `
          SELECT seikyu_meisai_head_id, MAX(seikyu_meisai_id) as max_id
          FROM ${SCHEMA}.t_seikyu_meisai
          WHERE seikyu_meisai_head_id = ANY($1::bigint[]) AND seikyu_head_id = $2
          GROUP BY seikyu_meisai_head_id;
        `;
        const maxMeisaiIdResult = await connection.query(maxMeisaiIdQuery, [headIds, allMeisaiHeads[0].seikyu_head_id]);
        maxMeisaiIdResult.rows.forEach((row) => {
          maxIdMap.set(row.seikyu_meisai_head_id, row.max_id);
        });
      }
      const insertMeisaiList: SeikyuMeisai[] = [];
      const updateMeisaiList: SeikyuMeisai[] = [];

      allMeisaiHeads.forEach((head) => {
        // 明細無ければreturn
        if (!head.meisai) {
          return;
        }

        // 親ごとに子の最大IDカウンターを初期化
        let currentMeisaiMaxId = maxIdMap.get(head.seikyu_meisai_head_id) || 0;

        head.meisai.forEach((meisai, i) => {
          const isNewMeisai = meisai.seikyu_meisai_id === FAKE_NEW_ID;

          const meisaiList = { ...meisai, seikyu_meisai_head_id: head.seikyu_meisai_head_id, dsp_ord_num: i + 1 };

          if (isNewMeisai) {
            currentMeisaiMaxId++;
            insertMeisaiList.push({
              ...meisaiList,
              seikyu_meisai_id: currentMeisaiMaxId,
            });
          } else {
            updateMeisaiList.push({
              ...meisaiList,
            });
          }
        });
      });

      // 削除 ---------------------------------------------
      // meisaiのIDの組み合わせ比較
      const existingMeisaiIds = await connection.query(
        `SELECT seikyu_head_id, seikyu_meisai_head_id, seikyu_meisai_id FROM ${SCHEMA}.t_seikyu_meisai WHERE seikyu_head_id = ${data.seikyuHeadId}`
      );
      console.log('今あるやつ', existingMeisaiIds.rows);
      const formedMeisai = updateMeisaiList.map((d) => ({
        seikyu_head_id: d.seikyu_head_id,
        seikyu_meisai_head_id: d.seikyu_meisai_head_id,
        seikyu_meisai_id: d.seikyu_meisai_id,
      }));
      console.log('フォームから来たやつ', formedMeisai);

      const meisaiToDelete: {
        seikyu_head_id: number;
        seikyu_meisai_head_id: number;
        seikyu_meisai_id: number;
      }[] = existingMeisaiIds.rows.filter(
        (ex) =>
          // incomingItemsの中に、existingとキーが完全一致するものが「一つも無い」(`!some`)場合にtrueを返す
          !formedMeisai.some(
            (f) =>
              ex.seikyu_head_id === f.seikyu_head_id &&
              ex.seikyu_meisai_head_id === f.seikyu_meisai_head_id &&
              f.seikyu_meisai_id === ex.seikyu_meisai_id
          )
      );
      // 削除明細リストがあれば削除処理
      if (meisaiToDelete.length > 0) {
        await deleteBillMeisai(meisaiToDelete, connection);
      }
      // meisaiHeads
      const exHeads = Array.from(
        new Set(existingMeisaiIds.rows.map(({ seikyu_meisai_id, ...rest }) => JSON.stringify(rest)))
      ).map((str) => JSON.parse(str));
      const formedHeads = Array.from(
        new Set(formedMeisai.map(({ seikyu_meisai_id, ...rest }) => JSON.stringify(rest)))
      ).map((str) => JSON.parse(str));

      const HeadsToDelete: {
        seikyu_head_id: number;
        seikyu_meisai_head_id: number;
      }[] = exHeads.filter(
        (ex) =>
          // incomingItemsの中に、existingとキーが完全一致するものが「一つも無い」(`!some`)場合にtrueを返す
          !formedHeads.some(
            (f) => ex.seikyu_head_id === f.seikyu_head_id && ex.seikyu_meisai_head_id === f.seikyu_meisai_head_id
          )
      );
      // 明細ヘッド削除処理
      if (HeadsToDelete.length > 0) {
        await deleteBillMeisaiHeads(HeadsToDelete, connection);
      }
      if (insertMeisaiList.length > 0) {
        await insertBillMeisai(
          insertMeisaiList.map(({ upd_dat, upd_user, ...rest }) => rest),
          connection
        );
      }
      if (updateMeisaiList.length > 0) {
        await updateBillMeisai(
          updateMeisaiList.map(({ add_dat, add_user, ...rest }) => rest),
          connection
        );
      }

      await connection.query('COMMIT');
      await revalidatePath('/bill-list');
      // return id.rows[0].seikyu_head_id;
      return null;
    }
    return null;
  } catch (e) {
    console.error('例外が発生', e);
    // エラーでロールバック
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    // なんにしてもpool解放
    connection.release();
  }
};
