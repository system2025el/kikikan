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
import { insertQuotHead, selectChosenMitu, updateQuotHead } from '@/app/_lib/db/tables/t-mitu-head';
import { insertQuotMeisai, selectQuotMeisai, updateQuotMeisai } from '@/app/_lib/db/tables/t-mitu-meisai';
import {
  insertQuotMeisaiHead,
  selectQuotMeisaiHead,
  updateQuoteMeisaiHead,
} from '@/app/_lib/db/tables/t-mitu-meisai-head';
import { selectJuchuKizaiHeadList } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectJuchu } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectKizaiHeadListForMitu } from '@/app/_lib/db/tables/v-mitu-kizai';
import { selectKizaiHeadListWithIsshikiForMitu } from '@/app/_lib/db/tables/v-mitu-kizai-isshiki';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';
import { MituHead } from '@/app/_lib/db/types/t-mitu-head-types';
import { MituMeisaiHead } from '@/app/_lib/db/types/t-mitu-meisai-head-type';
import { MituMeisai } from '@/app/_lib/db/types/t-mitu-meisai-type';
import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { JuchuValues, QuotHeadValues, QuotMaisaiHeadValues } from './types';

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
      id: d.user_nam!,
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
 * 選択された見積IDの見積書情報を取得する関数
 * @param mituId 選択された見積ヘッドID
 */
export const getChosenQuot = async (mituId: number) => {
  // 明細のデータ変換をする
  const transformMeisaiHead = (head: MituMeisaiHead, meisais: MituMeisai[]) => ({
    mituMeisaiHeadId: head.mitu_meisai_head_id,
    mituMeisaiHeadNam: head.mitu_meisai_head_nam,
    mituMeisaiKbn: head.mitu_meisai_head_kbn,
    headNamDspFlg: Boolean(head.head_nam_dsp_flg),
    nebikiNam: head.nebiki_nam,
    nebikiAmt: head.nebiki_amt,
    nebikiAftAmt: head.nebiki_aft_amt,
    nebikiAftNam: head.nebiki_aft_nam,
    shokeiMei: head.shokei_mei,
    biko1: head.biko_1,
    biko2: head.biko_2,
    biko3: head.biko_3,
    meisai: meisais.map((m) => ({
      id: m.mitu_meisai_id,
      nam: m.mitu_meisai_nam,
      qty: m.meisai_qty,
      honbanbiQty: m.meisai_honbanbi_qty,
      tankaAmt: m.meisai_tanka_amt,
      shokei_amt: m.shokei_amt,
    })),
  });
  try {
    // 見積ヘッドの取得
    const { data: mituData, error: mituError } = await selectChosenMitu(mituId);
    if (mituError) throw new Error('DBエラー：t_mitu_head');
    console.log(mituData);

    // 受注情報と明細情報を並列を取得
    const [juchuResult, meisaiHeadResult, meisaiResult] = await Promise.all([
      mituData.juchu_head_id ? selectJuchu(mituData.juchu_head_id) : Promise.resolve({ data: null, error: null }),
      selectQuotMeisaiHead(mituData.mitu_head_id),
      selectQuotMeisai(mituData.mitu_head_id),
    ]);

    const { data: juchuData, error: juchuError } = juchuResult;
    if (juchuError) throw new Error('DBエラー：v_juchu_lst');
    const { data: meisaiHeads, error: meisaiHeadError } = meisaiHeadResult;
    const { data: meisais, error: meisaiError } = meisaiResult;
    if (meisaiHeadError || meisaiError) throw new Error('DBエラー：明細取得時');

    // 受注情報の整形
    const juchus: JuchuValues | null = juchuData
      ? {
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
        }
      : null;

    // 明細をヘッダIDごとにグループ化
    const meisaisByHeadId = meisais.reduce((acc: Record<number, MituMeisai[]>, current: MituMeisai) => {
      const headId = current.mitu_meisai_head_id;
      if (!acc[headId]) {
        acc[headId] = [];
      }
      acc[headId].push(current);
      return acc;
    }, {});

    // ヘッダを区分ごとに分類・整形
    // 初期値
    const initialKbnMeisais: {
      kizai: QuotMaisaiHeadValues[];
      labor: QuotMaisaiHeadValues[];
      other: QuotMaisaiHeadValues[];
    } = { kizai: [], labor: [], other: [] };
    const kbnMeisais = meisaiHeads.reduce((acc, head) => {
      const associatedMeisais = meisaisByHeadId[head.mitu_meisai_head_id] || [];
      const transformedHead = transformMeisaiHead(head, associatedMeisais);

      switch (head.mitu_meisai_head_kbn) {
        case 0: // kizai
          acc.kizai.push(transformedHead);
          break;
        case 1: // labor
          acc.labor.push(transformedHead);
          break;
        case 2: // other
          acc.other.push(transformedHead);
          break;
      }
      return acc;
    }, initialKbnMeisais);

    // 見積の全情報
    const allData: QuotHeadValues = {
      mituHeadId: mituData.mitu_head_id,
      juchuHeadId: mituData.juchu_head_id,
      mituSts: mituData.mitu_sts,
      mituDat: mituData.mitu_dat ? new Date(mituData.mitu_dat) : null,
      mituHeadNam: mituData.mitu_head_nam,
      kokyaku: mituData.kokyaku_nam,
      nyuryokuUser: mituData.nyuryoku_user,
      mituRange:
        mituData.mitu_str_dat && mituData.mitu_end_dat
          ? { strt: new Date(mituData.mitu_str_dat), end: new Date(mituData.mitu_end_dat) }
          : { strt: null, end: null },
      kokyakuTantoNam: mituData.kokyaku_tanto_nam,
      koenNam: mituData.koen_nam,
      koenbashoNam: mituData.koenbasho_nam,
      mituHonbanbiQty: mituData.mitu_honbanbi_qty,
      biko: mituData.biko,
      comment: mituData.comment,
      chukeiMei: mituData.chukei_mei,
      tokuNebikiMei: mituData.toku_nebiki_mei,
      tokuNebikiAmt: mituData.toku_nebiki_amt,
      zeiAmt: mituData.zei_amt,
      zeiRat: mituData.zei_rat,
      gokeiMei: mituData.gokei_mei,
      gokeiAmt: mituData.gokei_amt,
      meisaiHeads: kbnMeisais, // 整形済みのデータを代入
    };
    console.log(juchus);
    console.log({ m: allData, j: juchus });
    return { m: allData, j: juchus };
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
    console.log('明細☆☆☆☆☆☆☆☆', data);
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
    console.log('一式有効明細☆☆☆☆☆☆☆☆', data);
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
  // // 明細
  // const meisais: MituMeisai[] = meisaiList.map((l, index) => ({
  //   mitu_head_id: data.mituHeadId!,
  //   mitu_meisai_head_id: l.mituMeisaiHeadId,
  //   mitu_meisai_id: l.id,
  //   mitu_meisai_nam: l.nam ?? null,
  //   meisai_qty: l.qty ?? 0,
  //   meisai_honbanbi_qty: l.honbanbiQty ?? 0,
  //   meisai_tanka_amt: l.tankaAmt ?? 0,
  //   shokei_amt: l.shokeiAmt ?? null,
  //   dsp_ord_num: index + 1,
  //   add_dat: toJapanTimeString(),
  //   add_user: user,
  //   upd_dat: toJapanTimeString(),
  //   upd_user: user,
  // }));

  try {
    console.log('更新START');
    // トランザクション開始
    await connection.query('BEGIN');
    if (quotHead) {
      // 見積ヘッダ更新処理
      await updateQuotHead(quotHead, connection);

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
            mituMeisaiHeadId: currentHeadMaxId, // 新しいID
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
