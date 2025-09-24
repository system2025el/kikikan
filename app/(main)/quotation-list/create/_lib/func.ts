'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';
import { insertQuotHead } from '@/app/_lib/db/tables/t-mitu-head';
import { insertQuotMeisai } from '@/app/_lib/db/tables/t-mitu-meisai';
import { insertQuotMeisaiHead } from '@/app/_lib/db/tables/t-mitu-meisai-head';
import { MituHead } from '@/app/_lib/db/types/t-mitu-head-types';
import { MituMeisaiHead } from '@/app/_lib/db/types/t-mitu-meisai-head-type';
import { MituMeisai } from '@/app/_lib/db/types/t-mitu-meisai-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { QuotHeadValues } from '../../_lib/types';

/**
 * 見積を保存する関数
 * @param data 見積書フォーム内容
 */
export const addQuot = async (data: QuotHeadValues, user: string): Promise<number | null> => {
  /* トランザクション準備 */
  const connection = await pool.connect();
  // 見積明細ヘッド準備
  const keys = ['kizai', 'labor', 'other'];
  // 明細ヘッドIDと明細IDの発番
  const meisaiheadList = keys
    .flatMap((key) => data.meisaiHeads?.[key as keyof typeof data.meisaiHeads] ?? [])
    .map((l, index) => ({
      ...l,
      mituMeisaiHeadId: index + 1,
      meisai: l.meisai?.map((m, i) => ({
        ...m,
        id: i + 1,
      })),
    }));
  // 見積明細準備
  const meisaiList = meisaiheadList.flatMap((l) =>
    l.meisai!.map((m) => ({
      ...m,
      mituMeisaiHeadId: l.mituMeisaiHeadId,
    }))
  );

  try {
    console.log('新規START');
    // トランザクション開始
    await connection.query('BEGIN');
    // 新見積ヘッドID
    const newMituHeadId = await connection.query(`
       SELECT coalesce(max(mitu_head_id),0) + 1 as newid FROM ${SCHEMA}.t_mitu_head
      `);
    console.log(newMituHeadId.rows[0].newid);
    // 見積ヘッド
    const quotHead: MituHead = {
      mitu_head_id: newMituHeadId.rows[0].newid,
      juchu_head_id: data.juchuHeadId,
      mitu_sts: data.mituSts,
      mitu_dat: data.mituDat ? toJapanTimeString(data.mituDat) : null,
      mitu_head_nam: data.mituHeadNam,
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
      add_dat: toJapanTimeString(),
      add_user: user,
    };
    // 明細ヘッド
    const meisaiHeads: MituMeisaiHead[] = meisaiheadList.map((l, index) => ({
      mitu_head_id: newMituHeadId.rows[0].newid,
      mitu_meisai_head_id: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
      mitu_meisai_head_kbn: l.mituMeisaiKbn,
      mitu_meisai_head_nam: l.mituMeisaiHeadNam,
      head_nam_dsp_flg: Number(l.headNamDspFlg),
      nebiki_nam: l.nebikiNam,
      nebiki_amt: l.nebikiAmt,
      nebiki_aft_nam: l.nebikiAftNam,
      nebiki_aft_amt: l.nebikiAftAmt,
      dsp_ord_num: index + 1,
      add_dat: toJapanTimeString(),
      add_user: user,
    }));
    // 明細
    const meisais: MituMeisai[] = meisaiList.map((l, index) => ({
      mitu_head_id: newMituHeadId.rows[0].newid,
      mitu_meisai_head_id: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
      mitu_meisai_id: l.id ?? FAKE_NEW_ID,
      mitu_meisai_nam: l.nam,
      meisai_qty: l.qty ?? 0,
      meisai_honbanbi_qty: l.honbanbiQty ?? 0,
      meisai_tanka_amt: l.tankaAmt ?? 0,
      shokei_amt: l.shokeiAmt,
      dsp_ord_num: index + 1,
      add_dat: toJapanTimeString(),
      add_user: user,
    }));
    if (quotHead) {
      const id = await insertQuotHead(quotHead, connection);
      await insertQuotMeisaiHead(meisaiHeads, connection);
      await insertQuotMeisai(meisais, connection);
      await connection.query('COMMIT');
      await revalidatePath('/quotation-list');
      redirect(`/quotation-list/edit/${id.rows[0].mitu_head_id}`);
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
