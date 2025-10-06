'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';
import { updateQuotHead } from '@/app/_lib/db/tables/t-mitu-head';
import { deleteQuotMeisai, insertQuotMeisai, updateQuotMeisai } from '@/app/_lib/db/tables/t-mitu-meisai';
import {
  deleteQuotMeisaiHeads,
  insertQuotMeisaiHead,
  updateQuoteMeisaiHead,
} from '@/app/_lib/db/tables/t-mitu-meisai-head';
import { MituHead } from '@/app/_lib/db/types/t-mitu-head-types';
import { MituMeisai } from '@/app/_lib/db/types/t-mitu-meisai-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { QuotHeadValues } from '../../../_lib/types';

/**
 * 見積ヘッドを更新する関数
 * @param data 見積ヘッドのデータ
 * @returns 見積ヘッドID
 */
export const updateQuot = async (data: QuotHeadValues, user: string): Promise<number | null> => {
  /* トランザクション準備 */
  const connection = await pool.connect();
  // 見積明細ヘッド準備
  const keys = ['kizai', 'labor', 'other'];
  // 明細ヘッドIDと明細IDの発番
  const meisaiheadList = keys
    .flatMap((key) => data.meisaiHeads?.[key as keyof typeof data.meisaiHeads] ?? [])
    .map((l) => ({
      ...l,
      mituMeisaiHeadId: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
      meisai: l.meisai?.map((m) => ({
        ...m,
        id: m.id ?? FAKE_NEW_ID,
      })),
    }));
  const kokyakuId = await connection.query(
    `SELECT kokyaku_id from ${SCHEMA}.m_kokyaku WHERE kokyaku_nam = '${data.kokyaku}'`
  );

  // // 見積明細準備
  // const meisaiList = meisaiheadList.flatMap((l) =>
  //   l.meisai!.map((m) => ({
  //     ...m,
  //     mituMeisaiHeadId: l.mituMeisaiHeadId,
  //   }))
  // );

  // 見積ヘッド
  const quotHead: MituHead = {
    mitu_head_id: data.mituHeadId!,
    juchu_head_id: data.juchuHeadId,
    mitu_sts: data.mituSts,
    mitu_dat: data.mituDat ? toJapanTimeString(data.mituDat) : null,
    mitu_head_nam: data.mituHeadNam,
    kokyaku_id: kokyakuId.rows[0].kokyaku_id ?? null,
    kokyaku_nam: data.kokyaku,
    nyuryoku_user: data.nyuryokuUser,
    mitu_str_dat: data.mituRange.strt ? toJapanTimeString(data.mituRange.strt) : null,
    mitu_end_dat: data.mituRange.end ? toJapanTimeString(data.mituRange.end) : null,
    kokyaku_tanto_nam: data.kokyakuTantoNam,
    koen_nam: data.koenNam,
    koenbasho_nam: data.koenbashoNam,
    mitu_honbanbi_qty: data.mituHonbanbiQty,
    biko: data.biko,
    comment: data.comment,
    chukei_mei: data.chukeiMei,
    toku_nebiki_mei: data.tokuNebikiMei,
    toku_nebiki_amt: data.tokuNebikiAmt,
    zei_amt: data.zeiAmt,
    zei_rat: data.zeiRat,
    gokei_mei: data.gokeiMei,
    gokei_amt: data.gokeiAmt,
    upd_dat: toJapanTimeString(),
    upd_user: user,
    kizai_chukei_mei: data.kizaiChukeiMei,
  };
  // 明細ヘッド
  console.log(`======================================${meisaiheadList}`);
  const meisaiHeads = meisaiheadList.map((l, index) => ({
    mitu_head_id: data.mituHeadId!,
    mitu_meisai_head_id: l.mituMeisaiHeadId,
    mitu_meisai_head_kbn: l.mituMeisaiKbn,
    mitu_meisai_head_nam: l.mituMeisaiHeadNam ?? null,
    head_nam_dsp_flg: Number(l.headNamDspFlg),
    nebiki_nam: l.nebikiNam ?? null,
    nebiki_amt: l.nebikiAmt ?? null,
    nebiki_aft_nam: l.nebikiAftNam ?? null,
    nebiki_aft_amt: l.nebikiAftAmt ?? null,
    dsp_ord_num: index + 1,
    biko_1: l.biko1,
    biko_2: l.biko2,
    biko_3: l.biko3,
    add_dat: toJapanTimeString(),
    add_user: user,
    upd_dat: toJapanTimeString(),
    upd_user: user,
    meisai: l.meisai?.map((m) => ({
      mitu_head_id: data.mituHeadId!,
      mitu_meisai_head_id: l.mituMeisaiHeadId,
      mitu_meisai_id: m.id,
      mitu_meisai_nam: m.nam ?? null,
      meisai_qty: m.qty ?? 0,
      meisai_honbanbi_qty: m.honbanbiQty ?? 0,
      meisai_tanka_amt: m.tankaAmt ?? 0,
      shokei_amt: m.shokeiAmt ?? null,
      dsp_ord_num: index + 1,
      add_dat: toJapanTimeString(),
      add_user: user,
      upd_dat: toJapanTimeString(),
      upd_user: user,
    })),
  }));

  try {
    console.log('更新START');
    // トランザクション開始
    await connection.query('BEGIN');
    if (quotHead) {
      // 見積ヘッダ更新処理
      await updateQuotHead(quotHead, connection);

      // 明細ヘッダ ------------------------------------------------
      // 明細ヘッドの最大IDを取得
      const headMaxIdResult = await connection.query(
        `SELECT MAX(mitu_meisai_head_id) as max_id FROM ${SCHEMA}.t_mitu_meisai_head WHERE mitu_head_id = $1`,
        [data.mituHeadId]
      );
      let currentHeadMaxId = headMaxIdResult.rows[0].max_id || 0;

      // idがFAKE_NEW_IDなら新規の見積ヘッダ
      const insertMHeadList = meisaiHeads
        .filter((d) => d.mitu_meisai_head_id === FAKE_NEW_ID)
        .map(({ upd_dat, upd_user, ...rest }) => rest)
        .map((h) => {
          currentHeadMaxId++;
          return {
            ...h, // ネストされた meisai 配列も維持
            mitu_meisai_head_id: currentHeadMaxId, // 新しいID
          };
        });
      const updateMHeadList = meisaiHeads
        .filter((d) => d.mitu_meisai_head_id !== FAKE_NEW_ID)
        .map(({ add_dat, add_user, ...rest }) => rest);

      // 見積ヘッダ新規挿入
      if (insertMHeadList.length > 0) {
        console.log('-------------------', insertMHeadList, '----------------------');
        // 新規処理実行
        await insertQuotMeisaiHead(
          insertMHeadList.map(({ meisai, ...rest }) => rest),
          connection
        );
      }
      // 見積ヘッダ更新処理
      if (updateMHeadList.length > 0) {
        // 更新処理実行
        await updateQuoteMeisaiHead(
          updateMHeadList.map(({ meisai, ...rest }) => rest),
          connection
        );
      }

      // 明細 ------------------------------------------------
      // すべての採番済みの明細ヘッドリスト（明細込み）
      const allMeisaiHeads = [...insertMHeadList, ...updateMHeadList];

      // 明細ヘッダIDのリスト
      const headIds = allMeisaiHeads.map((p) => p.mitu_meisai_head_id);
      // mitu_meisai_head_idと最大mitu_meisai_idのmap化
      const maxIdMap = new Map<number, number>();
      if (headIds.length > 0) {
        // 明細ヘッドごとの最大明細IDを取得
        const maxMeisaiIdQuery = `
          SELECT mitu_meisai_head_id, MAX(mitu_meisai_id) as max_id
          FROM ${SCHEMA}.t_mitu_meisai
          WHERE mitu_meisai_head_id = ANY($1::bigint[]) AND mitu_head_id = $2
          GROUP BY mitu_meisai_head_id;
        `;
        const maxMeisaiIdResult = await connection.query(maxMeisaiIdQuery, [headIds, allMeisaiHeads[0].mitu_head_id]);
        maxMeisaiIdResult.rows.forEach((row) => {
          maxIdMap.set(row.mitu_meisai_head_id, row.max_id);
        });
      }
      const insertMeisaiList: MituMeisai[] = [];
      const updateMeisaiList: MituMeisai[] = [];

      allMeisaiHeads.forEach((head) => {
        // 明細無ければreturn
        if (!head.meisai) {
          return;
        }

        // 親ごとに子の最大IDカウンターを初期化
        let currentMeisaiMaxId = maxIdMap.get(head.mitu_meisai_head_id) || 0;

        head.meisai.forEach((meisai, i) => {
          const isNewMeisai = meisai.mitu_meisai_id === FAKE_NEW_ID;

          const meisaiList = { ...meisai, mitu_meisai_head_id: head.mitu_meisai_head_id, dsp_ord_num: i + 1 };

          if (isNewMeisai) {
            currentMeisaiMaxId++;
            insertMeisaiList.push({
              ...meisaiList,
              mitu_meisai_id: currentMeisaiMaxId,
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
        `SELECT mitu_head_id, mitu_meisai_head_id, mitu_meisai_id FROM ${SCHEMA}.t_mitu_meisai WHERE mitu_head_id = ${data.mituHeadId}`
      );
      console.log('今あるやつ', existingMeisaiIds.rows);
      const formedMeisai = updateMeisaiList.map((d) => ({
        mitu_head_id: d.mitu_head_id,
        mitu_meisai_head_id: d.mitu_meisai_head_id,
        mitu_meisai_id: d.mitu_meisai_id,
      }));
      console.log('フォームから来たやつ', formedMeisai);

      const meisaiToDelete: {
        mitu_head_id: number;
        mitu_meisai_head_id: number;
        mitu_meisai_id: number;
      }[] = existingMeisaiIds.rows.filter(
        (ex) =>
          // incomingItemsの中に、existingとキーが完全一致するものが「一つも無い」(`!some`)場合にtrueを返す
          !formedMeisai.some(
            (f) =>
              ex.mitu_head_id === f.mitu_head_id &&
              ex.mitu_meisai_head_id === f.mitu_meisai_head_id &&
              f.mitu_meisai_id === ex.mitu_meisai_id
          )
      );
      // 削除明細リストがあれば削除処理
      if (meisaiToDelete.length > 0) {
        await deleteQuotMeisai(meisaiToDelete, connection);
      }
      // meisaiHeads
      const exHeads = Array.from(
        new Set(existingMeisaiIds.rows.map(({ mitu_meisai_id, ...rest }) => JSON.stringify(rest)))
      ).map((str) => JSON.parse(str));
      const formedHeads = Array.from(
        new Set(formedMeisai.map(({ mitu_meisai_id, ...rest }) => JSON.stringify(rest)))
      ).map((str) => JSON.parse(str));

      const HeadsToDelete: {
        mitu_head_id: number;
        mitu_meisai_head_id: number;
      }[] = exHeads.filter(
        (ex) =>
          // incomingItemsの中に、existingとキーが完全一致するものが「一つも無い」(`!some`)場合にtrueを返す
          !formedHeads.some(
            (f) => ex.mitu_head_id === f.mitu_head_id && ex.mitu_meisai_head_id === f.mitu_meisai_head_id
          )
      );
      // 明細ヘッド削除処理
      if (HeadsToDelete.length > 0) {
        await deleteQuotMeisaiHeads(HeadsToDelete, connection);
      }
      if (insertMeisaiList.length > 0) {
        await insertQuotMeisai(
          insertMeisaiList.map(({ upd_dat, upd_user, ...rest }) => rest),
          connection
        );
      }
      if (updateMeisaiList.length > 0) {
        await updateQuotMeisai(
          updateMeisaiList.map(({ add_dat, add_user, ...rest }) => rest),
          connection
        );
      }

      await connection.query('COMMIT');
      await revalidatePath('/quotation-list');
      // return id.rows[0].mitu_head_id;
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
