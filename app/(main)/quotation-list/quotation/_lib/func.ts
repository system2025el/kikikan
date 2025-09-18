'use server';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { selectActiveMituSts } from '@/app/_lib/db/tables/m-mitu-sts';
import { selectActiveUsers } from '@/app/_lib/db/tables/m-user';
import { selectJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import { selectJuchuHonbanbiQty } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { selectHonbanbi } from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import { insertQuotHead, updateQuotHead } from '@/app/_lib/db/tables/t-mitu-head';
import { insertQuotMeisai } from '@/app/_lib/db/tables/t-mitu-meisai';
import { insertQuotMeisaiHead } from '@/app/_lib/db/tables/t-mitu-meisai-head';
import { selectJuchuKizaiHeadList } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectJuchu } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectKizaiHeadListForMitu } from '@/app/_lib/db/tables/v-mitu-kizai';
import { selectKizaiHeadListWithIsshikiForMitu } from '@/app/_lib/db/tables/v-mitu-kizai-isshiki';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';
import { MituHead } from '@/app/_lib/db/types/t-mitu-head-types';
import { MituMeisaiHead } from '@/app/_lib/db/types/t-mitu-meisai-head-type';
import { MituMeisai } from '@/app/_lib/db/types/t-mitu-meisai-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { JuchuValues, QuotHeadValues } from './types';

/**
 * 担当者の選択肢リスト取得関数
 * @returns 担当者の選択肢リスト
 */
export const getUsersSelection = async () => {
  try {
    const { data, error } = await selectActiveUsers();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型する
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.shain_cod!,
      label: d.user_nam,
    }));
    console.log('担当者が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('担当者取得DBエラー', e);
    throw e;
  }
};

/**
 * 見積ステータス選択肢を取得する関数
 * @returns {SelectTypes[]} 見積ステータスの配列
 */
export const getMituStsSelection = async () => {
  try {
    const { data, error } = await selectActiveMituSts();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型する
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.sts_id!,
      label: d.sts_nam,
    }));
    console.log('mitu_stsが', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 受注ヘッダIDが等しい受注ヘッダを取得する
 * @param id 受注ヘッダID
 * @returns 見積画面で表示される受注ヘッダ
 */
export const getOrderForQuotation = async (id: number): Promise<JuchuValues | null> => {
  try {
    const { data: juchuData, error } = await selectJuchu(id);
    if (error) {
      return null;
    }
    const order: JuchuValues = {
      juchuHeadId: juchuData.juchu_head_id,
      juchuSts: juchuData.juchu_sts_nam,
      juchuDat: juchuData.juchu_dat ? new Date(juchuData.juchu_dat) : null,
      juchuRange:
        juchuData.juchu_str_dat && juchuData.juchu_end_dat
          ? { strt: new Date(juchuData.juchu_str_dat), end: new Date(juchuData.juchu_end_dat) }
          : { strt: null, end: null },
      nyuryokuUser: juchuData.nyuryoku_user,
      koenNam: juchuData.koen_nam,
      koenbashoNam: juchuData.koenbasho_nam,
      kokyaku: { id: juchuData.kokyaku_id, name: juchuData.kokyaku_nam },
      kokyakuTantoNam: juchuData.kokyaku_tanto_nam,
      mem: juchuData.mem,
      nebikiAmt: juchuData.nebiki_amt,
      zeiKbn: juchuData.zei_nam,
    };
    console.log('GetOrder order : ', order);
    return order;
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 選択用の機材ヘッダ名、受注ヘッドID、機材明細ヘッドIDを取得する関数
 * @param juchuId 受注ヘッドID
 * @returns 選択用の機材ヘッダ名、受注ヘッドID、機材明細ヘッドIDの配列
 */
export const getJuchuKizaiHeadNamList = async (juchuId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiHeadList(juchuId);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('明細名リスト', data.length, '件');
    return data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      headNam: d.head_nam,
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 選択された機材明細ヘッダの明細を取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 機材ヘッダID
 * @returns 機材明細の配列
 */
export const getJuchuKizaiMeisaiList = async (juchuId: number, kizaiHeadId: number) => {
  try {
    const { data, error } = await selectKizaiHeadListForMitu(juchuId, kizaiHeadId); // ビューが欲しい
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('明細だよ☆☆☆☆☆☆☆☆', data);
    return data.map((d) => ({
      nam: d.kizai_nam,
      qty: d.plan_kizai_qty,
      honbanbiQty: d.juchu_honbanbi_calc_qty,
      tankaAmt: d.kizai_tanka_amt,
      shokeiAmt: (d.plan_kizai_qty ?? 0) * (d.juchu_honbanbi_calc_qty ?? 0) * (d.kizai_tanka_amt ?? 0),
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 選択された機材明細ヘッダの明細を一式でまとめて取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 機材ヘッダID
 * @returns 一式でまとめた機材明細の配列
 */
export const getJuchuMeisaiSum = async (juchuId: number, kizaiHeadId: number) => {
  try {
    const { data, error } = await selectKizaiHeadListWithIsshikiForMitu(juchuId, kizaiHeadId);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('一式有効明細だよ☆☆☆☆☆☆☆☆', data);
    return data.map((d) => ({
      nam: d.kizai_nam,
      qty: d.plan_kizai_qty,
      honbanbiQty: d.juchu_honbanbi_calc_qty,
      tankaAmt: d.kizai_tanka_amt,
      shokeiAmt: (d.plan_kizai_qty ?? 0) * (d.juchu_honbanbi_calc_qty ?? 0) * (d.kizai_tanka_amt ?? 0),
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 見積を保存する関数
 * @param data 見積書フォーム内容
 */
export const saveQuot = async (data: QuotHeadValues): Promise<number | null> => {
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
    // スキーマ指定
    await connection.query(`SET search_path TO ${SCHEMA};`);
    // 新見積ヘッドID
    const newMituHeadId = await connection.query(`
       SELECT coalesce(max(mitu_head_id),0) + 1 as newid FROM t_mitu_head
      `);
    console.log(newMituHeadId.rows[0].newid);
    // 見積ヘッド
    const quotHead: MituHead = {
      mitu_head_id: newMituHeadId.rows[0].newid,
      juchu_head_id: data.juchuHeadId,
      mitu_sts: data.mituSts,
      mitu_dat: data.mituDat ? toJapanTimeString(data.mituDat) : null,
      mitu_head_nam: data.mituHeadNam,
      // kokyaku_nam????
      kokyaku_nam: data.kokyaku,
      nyuryoku_user: data.nyuryokuUser.name,
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
    };
    // 明細ヘッド
    const meisaiHeads: MituMeisaiHead[] = meisaiheadList.map((l) => ({
      mitu_head_id: newMituHeadId.rows[0].newid,
      mitu_meisai_head_id: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
      mitu_meisai_head_kbn: l.mituMeisaiKbn,
      mitu_meisai_head_nam: l.mituMeisaiHeadNam,
      head_nam_dsp_flg: Number(l.headNamDspFlg),
      nebiki_nam: l.nebikiNam,
      nebiki_amt: l.nebikiAmt,
      nebiki_aft_nam: l.nebikiAftNam,
      nebiki_aft_amt: l.nebikiAftAmt,
    }));
    // 明細
    const meisais: MituMeisai[] = meisaiList.map((l) => ({
      mitu_head_id: newMituHeadId.rows[0].newid,
      mitu_meisai_head_id: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
      mitu_meisai_id: l.id ?? FAKE_NEW_ID,
      mitu_meisai_nam: l.nam,
      meisai_qty: l.qty ?? 0,
      meisai_honbanbi_qty: l.honbanbiQty ?? 0,
      meisai_tanka_amt: l.tankaAmt ?? 0,
      shokei_amt: l.shokeiAmt,
    }));
    if (quotHead) {
      const id = await insertQuotHead(quotHead, connection);
      await insertQuotMeisaiHead(meisaiHeads, connection);
      await insertQuotMeisai(meisais, connection);
      await revalidatePath('/quotation-list/quotation');
      await connection.query('COMMIT');
      return id.rows[0].mitu_head_id;
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

/**
 * 見積ヘッドを更新する関数
 * @param data 見積ヘッドのデータ
 * @returns 見積ヘッドID
 */
export const updateQuot = async (data: QuotHeadValues): Promise<number | null> => {
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

  // 見積ヘッド
  const quotHead: MituHead = {
    mitu_head_id: data.mituHeadId!,
    juchu_head_id: data.juchuHeadId,
    mitu_sts: data.mituSts,
    mitu_dat: data.mituDat ? toJapanTimeString(data.mituDat) : null,
    mitu_head_nam: data.mituHeadNam,
    // kokyaku_nam????
    kokyaku_nam: data.kokyaku,
    nyuryoku_user: data.nyuryokuUser.name,
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
  };
  // 明細ヘッド
  const meisaiHeads: MituMeisaiHead[] = meisaiheadList.map((l) => ({
    mitu_head_id: data.mituHeadId!,
    mitu_meisai_head_id: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
    mitu_meisai_head_kbn: l.mituMeisaiKbn,
    mitu_meisai_head_nam: l.mituMeisaiHeadNam,
    head_nam_dsp_flg: Number(l.headNamDspFlg),
    nebiki_nam: l.nebikiNam,
    nebiki_amt: l.nebikiAmt,
    nebiki_aft_nam: l.nebikiAftNam,
    nebiki_aft_amt: l.nebikiAftAmt,
  }));
  // 明細
  const meisais: MituMeisai[] = meisaiList.map((l) => ({
    mitu_head_id: data.mituHeadId!,
    mitu_meisai_head_id: l.mituMeisaiHeadId ?? FAKE_NEW_ID,
    mitu_meisai_id: l.id ?? FAKE_NEW_ID,
    mitu_meisai_nam: l.nam,
    meisai_qty: l.qty ?? 0,
    meisai_honbanbi_qty: l.honbanbiQty ?? 0,
    meisai_tanka_amt: l.tankaAmt ?? 0,
    shokei_amt: l.shokeiAmt,
  }));

  try {
    console.log('更新START');
    // トランザクション開始
    await connection.query('BEGIN');
    // スキーマ指定
    await connection.query(`SET search_path TO ${SCHEMA};`);
    if (quotHead) {
      // 更新処理
      const id = await updateQuotHead(quotHead, connection);
      // await upsertQuoteMeisaiHead(meisaiHeads, connection);
      // await upsertQuoteMeisai(meisais, connection);
      await revalidatePath('/quotation-list/quotation');
      await connection.query('COMMIT');
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
