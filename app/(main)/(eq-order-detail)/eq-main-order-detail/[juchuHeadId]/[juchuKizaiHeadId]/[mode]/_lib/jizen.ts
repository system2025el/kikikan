import { subDays } from 'date-fns';

import { BASHO_ID } from '@/app/_lib/constants';
import { toJapanStartOfDay } from '@/app/(main)/_lib/date-conversion';
import { getRange } from '@/app/(main)/_lib/date-funcs';

import { JuchuKizaiMeisaiValues } from './types';

/**
 * 明細の出庫場所に対応する出庫日時
 * @param row 受注機材明細
 * @param kicsShukoDat KICS出庫日時
 * @param yardShukoDat YARD出庫日時
 */
export const getMeisaiShukoDat = (
  row: JuchuKizaiMeisaiValues,
  kicsShukoDat: Date | null,
  yardShukoDat: Date | null
): Date | null => (row.shozokuId === BASHO_ID.kics ? kicsShukoDat : yardShukoDat);

/**
 * 事前準備日時・準備数を設定した明細を返す
 * 解除時はプロパティごと外す（元データには項目自体が無いため、null を入れると JSON 比較で未保存扱いのまま残る）
 * @param row 受注機材明細
 * @param jizenDat 事前準備日時（null で解除）
 * @param jizenQty 事前準備数
 */
export const withJizen = (
  row: JuchuKizaiMeisaiValues,
  jizenDat: Date | null,
  jizenQty: number | null
): JuchuKizaiMeisaiValues => {
  const { jizenDat: _dat, jizenQty: _qty, ...rest } = row;
  if (!jizenDat) return rest;
  return { ...rest, jizenDat, jizenQty: jizenQty ?? row.planQty };
};

/**
 * 事前準備で在庫を減らす日（準備日〜出庫日の前日）
 * 出庫日当日に準備する場合は0日になる（当日は元々合計数で引き当て済み）
 * @param row 受注機材明細
 * @param kicsShukoDat KICS出庫日時
 * @param yardShukoDat YARD出庫日時
 * @returns 'YYYY/MM/DD' の配列
 */
export const getJizenRange = (
  row: JuchuKizaiMeisaiValues,
  kicsShukoDat: Date | null,
  yardShukoDat: Date | null
): string[] => {
  if (row.delFlag || !row.jizenDat) return [];
  const shukoDat = getMeisaiShukoDat(row, kicsShukoDat, yardShukoDat);
  if (!shukoDat) return [];
  return getRange(row.jizenDat, subDays(shukoDat, 1));
};

/**
 * 事前準備による在庫数の増減（機材×日付）
 * 在庫データ（DB）は元データの事前準備を反映済みなので、元データとの差分だけ在庫を減らす
 * @param rows 受注機材明細（編集中）
 * @param originRows 受注機材明細（元データ）
 * @param kicsShukoDat KICS出庫日時
 * @param yardShukoDat YARD出庫日時
 * @returns キーは `${kizaiId}_${YYYY/MM/DD}`、値は在庫数から引く数
 */
export const getJizenStockDiff = (
  rows: JuchuKizaiMeisaiValues[],
  originRows: JuchuKizaiMeisaiValues[],
  kicsShukoDat: Date | null,
  yardShukoDat: Date | null
): Map<string, number> => {
  const diff = new Map<string, number>();
  const add = (list: JuchuKizaiMeisaiValues[], sign: number) => {
    for (const row of list) {
      for (const date of getJizenRange(row, kicsShukoDat, yardShukoDat)) {
        const key = `${row.kizaiId}_${date}`;
        diff.set(key, (diff.get(key) ?? 0) + sign * (row.jizenQty ?? 0));
      }
    }
  };
  add(rows, 1);
  add(originRows, -1);
  return diff;
};

/**
 * 在庫テーブルの基準日（テーブルの左端はこの前日）
 * 事前準備がある明細があれば、最も過去の準備日を基準にする
 * @param shukoDate 出庫日
 * @param rows 受注機材明細
 */
export const getStockAnchorDate = (shukoDate: Date | null, rows: JuchuKizaiMeisaiValues[]): Date | null => {
  const jizenDates = rows.filter((row) => !row.delFlag && row.jizenDat).map((row) => row.jizenDat!.getTime());
  if (jizenDates.length === 0) return shukoDate;
  const earliest = toJapanStartOfDay(new Date(Math.min(...jizenDates)));
  if (!shukoDate) return earliest;
  return earliest < toJapanStartOfDay(shukoDate) ? earliest : shukoDate;
};

/**
 * 事前準備の入力チェック
 * @param rows 受注機材明細
 * @param kicsShukoDat KICS出庫日時（入力中の値）
 * @param yardShukoDat YARD出庫日時（入力中の値）
 * @returns エラーメッセージ（問題なければ空配列）
 */
export const validateJizen = (
  rows: JuchuKizaiMeisaiValues[],
  kicsShukoDat: Date | null,
  yardShukoDat: Date | null
): string[] => {
  const messages: string[] = [];
  for (const row of rows) {
    if (row.delFlag || !row.jizenDat) continue;
    const name = row.kizaiNam.trim();
    const shukoDat = getMeisaiShukoDat(row, kicsShukoDat, yardShukoDat);
    if (!shukoDat) {
      messages.push(`${name}：出庫日時が未設定のため準備日時は入力できません`);
    } else if (row.jizenDat.getTime() >= shukoDat.getTime()) {
      messages.push(`${name}：準備日時は出庫日時より前にしてください`);
    }
    const qty = row.jizenQty ?? 0;
    if (qty < 1) {
      messages.push(`${name}：準備数は1以上にしてください`);
    } else if (qty > row.planQty) {
      messages.push(`${name}：準備数が合計数（${row.planQty}）を超えています`);
    }
  }
  return messages;
};

/**
 * 事前準備の項目（準備日時・準備数）を外した明細
 * 明細の変更判定（checkJuchuKizaiMeisai）に使う。事前準備だけを変えたときに、明細・本番の伝票・入庫伝票の
 * 処理まで走らないようにするため
 * @param rows 受注機材明細
 */
export const withoutJizen = (rows: JuchuKizaiMeisaiValues[]) =>
  rows.map(({ jizenDat: _dat, jizenQty: _qty, ...rest }) => rest);

/**
 * 事前準備が変わった明細（追加・変更・解除）
 * 明細の追加・削除はここでは見ない（明細の変更として扱い、保存時に事前準備も一緒に処理する）
 * @param originRows 受注機材明細（元データ）
 * @param rows 受注機材明細（編集中）
 */
export const getJizenChangedRows = (originRows: JuchuKizaiMeisaiValues[], rows: JuchuKizaiMeisaiValues[]) => {
  const originMap = new Map(originRows.map((d) => [`${d.juchuKizaiMeisaiId}_${d.kizaiId}`, d]));
  return rows.filter((row) => {
    if (row.delFlag || !row.saveFlag) return false;
    const origin = originMap.get(`${row.juchuKizaiMeisaiId}_${row.kizaiId}`);
    if (!origin) return false;
    return (
      (origin.jizenDat?.getTime() ?? null) !== (row.jizenDat?.getTime() ?? null) ||
      (origin.jizenQty ?? null) !== (row.jizenQty ?? null)
    );
  });
};
