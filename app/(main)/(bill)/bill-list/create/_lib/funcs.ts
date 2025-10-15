'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';
import { insertBillHead } from '@/app/_lib/db/tables/t-seikyu-head';
import { insertBillMeisai } from '@/app/_lib/db/tables/t-seikyu-meisai';
import { insertBillMeisaiHead } from '@/app/_lib/db/tables/t-seikyu-meisai-head';
import { selectFilteredJuchuDetailsForBill, selectFilteredJuchusForBill } from '@/app/_lib/db/tables/v-seikyu-date-lst';
import { SeikyuHead } from '@/app/_lib/db/types/t-seikyu-head-type';
import { SeikyuMeisaiHead } from '@/app/_lib/db/types/t-seikyu-meisai-head-type';
import { SeikyuMeisai } from '@/app/_lib/db/types/t-seikyu-meisai-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { BillHeadValues, BillMeisaiHeadsValues } from '../../_lib/types';

/**
 * 請求用に受注情報を取得する関数
 * @param queries 顧客id, 取得最終日, 詳細表示フラグ
 * @returns 請求画面に表示する情報
 */
export const getJuchusForBill = async (queries: {
  kokyakuId: number;
  date: string;
  flg: boolean;
  tantouNam: string | null;
}): Promise<BillMeisaiHeadsValues[]> => {
  console.log('新規だよ', queries);
  const { kokyakuId, date, flg, tantouNam } = queries;
  try {
    if (flg) {
      // 詳細表示するとき ------------------------------------------------------------------------
      const juchus = await selectFilteredJuchuDetailsForBill({
        kokyakuId: kokyakuId,
        date: date,
        tantouNam: tantouNam,
      });
      if (!juchus) {
        throw new Error('DB取得エラー');
      }
      if (!juchus.rows || juchus.rows.length === 0) {
        return [];
      }
      console.log('受注情報', juchus.rows);
      // juchus.rowsをグループ化して整形
      const groupedResult = juchus.rows.reduce((acc, currentRow) => {
        // グループ化するためのユニークなキー
        const groupKey = `${currentRow.juchu_head_id}-${currentRow.juchu_kizai_head_id}`;

        // まだこのグループの親オブジェクトが作られていなければ作成
        if (!acc[groupKey]) {
          acc[groupKey] = {
            juchuHeadId: currentRow.juchu_head_id,
            juchuKizaiHeadId: currentRow.juchu_kizai_head_id,
            seikyuMeisaiHeadNam: currentRow.head_nam,
            koenNam: currentRow.koen_nam,
            seikyuRange: {
              strt: currentRow.seikyu_dat ? new Date(currentRow.seikyu_dat) : new Date(currentRow.shuko_dat),
              end: new Date(currentRow.nyuko_dat) > new Date(date) ? new Date(date) : new Date(currentRow.nyuko_dat),
            },
            koenbashoNam: currentRow.koenbasho_nam,
            kokyakuTantoNam: currentRow.kokyaku_tanto_nam,
            zeiFlg: false,
            meisai: [], // 明細を入れるための空配列
          };
        }

        // 現在の行を明細データとして整形し、meisai配列に追加
        const honbanbiQty = (Number(currentRow.honbanbi_qty) || 0) + (Number(currentRow.add_dat_qty) || 0);
        const tankaAmt = Number(currentRow.kizai_tanka_amt) || 0;
        const planQty = Number(currentRow.plan_qty) || 0;

        acc[groupKey].meisai.push({
          nam: currentRow.kizai_nam,
          qty: planQty,
          honbanbiQty: honbanbiQty,
          tankaAmt: tankaAmt,
          shokeiAmt: Math.round(planQty * honbanbiQty * tankaAmt),
        });

        return acc;
      }, {});

      // reduceの結果はオブジェクトなので、最後にObject.values()で配列に変換します
      return Object.values(groupedResult);
    } else {
      // 明細をまとめて表示するとき -------------------------------------------------------------
      const juchus = await selectFilteredJuchusForBill({ kokyakuId: kokyakuId, date: date, tantouNam: tantouNam });
      if (!juchus) {
        throw new Error('DB取得エラー');
      }
      if (!juchus.rows || juchus.rows.length === 0) {
        return [];
      }
      console.log('受注情報', juchus.rows);
      return juchus.rows.map((j) => ({
        juchuHeadId: j.juchu_head_id,
        juchuKizaiHeadId: j.juchu_kizai_head_id,
        seikyuMeisaiHeadNam: j.head_nam,
        koenNam: j.koen_nam,
        seikyuRange: {
          strt: j.seikyu_dat ? new Date(j.seikyu_dat) : new Date(j.shuko_dat),
          end: new Date(j.nyuko_dat) > new Date(date) ? new Date(date) : new Date(j.nyuko_dat),
        },
        koenbashoNam: j.koenbasho_nam,
        kokyakuTantoNam: j.kokyaku_tanto_nam,
        zeiFlg: false,
        meisai: Array.isArray(juchus.rows)
          ? juchus.rows.filter(
              (m) =>
                m.juchu_head_id === j.juchu_head_id && m.juchu_kizai_head_id === j.juchu_kizai_head_id && m.shokei_amt
            ).length === 0
            ? []
            : juchus.rows
                .filter(
                  (m) =>
                    m.juchu_head_id === j.juchu_head_id &&
                    m.juchu_kizai_head_id === j.juchu_kizai_head_id &&
                    m.shokei_amt
                )
                .map((m) => ({
                  nam: `${m.head_nam}一式`,
                  qty: 1,
                  honbanbiQty: (Number(m.honbanbi_qty) ?? 0) + (Number(m.add_dat_qty) ?? 0),
                  tankaAmt: Number(m.shokei_amt),
                  shokeiAmt: Math.round(1 * (Number(m.honbanbi_qty) + Number(m.add_dat_qty)) * Number(m.shokei_amt)),
                  ...m,
                }))
          : [],
      }));
    }
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};

/**
 * 請求を保存する関数
 * @param data 請求書フォーム内容
 */
const addBilling = async (data: BillHeadValues, user: string): Promise<number | null> => {
  /* トランザクション準備 */
  const connection = await pool.connect();
  // 明細ヘッドIDと明細IDの発番
  const meisaiheadList =
    data.meisaiHeads?.map((l, index) => ({
      ...l,
      seikyuMeisaiHeadId: index + 1,
      meisai: l?.meisai?.map((m, i) => ({
        ...m,
        id: i + 1,
      })),
    })) ?? [];
  // 請求明細準備
  const meisaiList =
    meisaiheadList.flatMap((l) =>
      l.meisai!.map((m) => ({
        ...m,
        seikyuMeisaiHeadId: l.seikyuMeisaiHeadId,
      }))
    ) ?? [];

  try {
    console.log('新規START');
    // トランザクション開始
    await connection.query('BEGIN');
    // 新請求ヘッドID
    const newSeikyuHeadId = await connection.query(`
       SELECT coalesce(max(seikyu_head_id),0) + 1 as newid FROM ${SCHEMA}.t_seikyu_head
      `);

    console.log(newSeikyuHeadId.rows[0].newid);
    // 請求ヘッド
    const billHead: SeikyuHead = {
      seikyu_head_id: newSeikyuHeadId.rows[0].newid,
      seikyu_sts: data.seikyuSts,
      seikyu_dat: data.seikyuDat ? toJapanTimeString(data.seikyuDat, '-') : null,
      seikyu_head_nam: data.seikyuHeadNam,
      adr_post: data.adr1,
      adr_shozai: data.adr2.shozai,
      adr_tatemono: data.adr2.tatemono,
      adr_sonota: data.adr2.sonota,
      kokyaku_id: data.aite.id,
      kokyaku_nam: data.aite.nam,
      nyuryoku_user: data.nyuryokuUser,
      zei_rat: data.zeiRat,
      add_dat: toJapanTimeString(undefined, '-'),
      add_user: user,
    };
    // 明細ヘッド
    const meisaiHeads: SeikyuMeisaiHead[] = meisaiheadList
      ? meisaiheadList.map((l, index) => ({
          seikyu_head_id: newSeikyuHeadId.rows[0].newid,
          seikyu_meisai_head_id: l.seikyuMeisaiHeadId ?? FAKE_NEW_ID,
          juchu_head_id: l.juchuHeadId,
          juchu_kizai_head_id: l.juchuKizaiHeadId,
          seikyu_str_dat: l.seikyuRange?.strt ? toJapanTimeString(l.seikyuRange.strt, '-') : null,
          seikyu_end_dat: l.seikyuRange?.end ? toJapanTimeString(l.seikyuRange.end, '-') : null,
          seikyu_meisai_head_nam: l.seikyuMeisaiHeadNam,
          koen_nam: l.koenNam,
          koenbasho_nam: l.koenbashoNam,
          kokyaku_tanto_nam: l.kokyakuTantoNam,
          nebiki_amt: l.nebikiAmt,
          zei_flg: Number(l.zeiFlg),
          dsp_ord_num: index + 1,
          add_dat: toJapanTimeString(undefined, '-'),
          add_user: user,
        }))
      : [];
    // 明細
    const meisais: SeikyuMeisai[] =
      meisaiList.map((l, index) => ({
        seikyu_head_id: newSeikyuHeadId.rows[0].newid,
        seikyu_meisai_head_id: l.seikyuMeisaiHeadId ?? FAKE_NEW_ID,
        seikyu_meisai_id: l.id ?? FAKE_NEW_ID,
        seikyu_meisai_nam: l.nam,
        meisai_qty: l.qty ?? 0,
        meisai_honbanbi_qty: l.honbanbiQty ?? 0,
        meisai_tanka_amt: l.tankaAmt ?? 0,
        // shokei_amt: l.shokeiAmt,
        dsp_ord_num: index + 1,
        add_dat: toJapanTimeString(undefined, '-'),
        add_user: user,
      })) ?? [];
    if (billHead) {
      const id = await insertBillHead(billHead, connection);
      if (meisaiHeads && Object.keys(meisaiHeads).length !== 0) {
        await insertBillMeisaiHead(meisaiHeads, connection);
      }
      if (meisais && Object.keys(meisais).length !== 0) {
        await insertBillMeisai(meisais, connection);
      }

      await connection.query('COMMIT');
      return id.rows[0].seikyu_head_id;
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
 * 請求を保存する関数を保存してリダイレクトする関数
 * @param data
 * @param user
 */
export const addBill = async (data: BillHeadValues, user: string) => {
  const id = await addBilling(data, user);
  await revalidatePath('/bill-list');
  await redirect(`/bill-list/edit/${id}`);
};
