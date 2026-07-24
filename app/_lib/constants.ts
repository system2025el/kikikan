/**
 * 作業区分ID（sagyo_kbn_id）
 */
export const SAGYO_KBN_ID = {
  /** 出庫ピッキング */
  shukoPicking: 10,
  /** 出庫最終確認 */
  shukoConfirmation: 20,
  /** 入庫カウント */
  nyukoCount: 30,
  /** 移動出庫 */
  idoShuko: 40,
  /** 移動入庫 */
  idoNyuko: 50,
  /** 出庫確定 */
  shukoConfirmed: 60,
  /** 入庫確定 */
  nyukoConfirmed: 70,
} as const;

/**
 * 受注機材ヘッダー区分ID（juchu_kizai_head_kbn）
 */
export const JUCHU_KIZAI_HEAD_KBN = {
  /** 通常 */
  normal: 1,
  /** 返却 */
  return: 2,
  /** キープ */
  keep: 3,
} as const;

/**
 * 場所ID（shozoku_id, sagyo_id, nyushuko_basho_id）
 */
export const BASHO_ID = {
  /** KICS */
  kics: 1,
  /** YARD */
  yard: 2,
  /** その他（厚木） */
  others: 3,
} as const;

/**
 * 作業指示ID（sagyo_siji_id）
 */
export const SAGYO_SIJI_ID = {
  /** KICS→YARD */
  ky: 1,
  /** YARD→KICS */
  yk: 2,
} as const;

/**
 * 入出庫種別ID（nyushuko_shubetu_id）
 */
export const NYUSHUKO_SHUBETU_ID = {
  /** 出庫 */
  shuko: 1,
  /** 入庫 */
  nyuko: 2,
} as const;

/**
 * ロック種別ID（lock_shubetu）
 */
export const LOCK_SHUBETU = {
  /** 受注ヘッダー */
  juchuHead: 1,
} as const;

/**
 * 辞書ID（dic_id）
 */
export const DIC_ID = {
  /** インデント文字 */
  indentChara: 1,
} as const;

/**
 * 受注本番日種別ID（juchu_honbanbi_shubetu_id）
 */
export const HONBANBI_SHUBETU_ID = {
  /** 使用中 */
  use: 1,
  /** 出庫 */
  shuko: 2,
  /** 入庫 */
  nyuko: 3,
  /** 仕込 */
  shikomi: 10,
  /** RH（リハーサル） */
  rh: 20,
  /** GP（ゲネプロ） */
  gp: 30,
  /** 本番 */
  honban: 40,
} as const;
