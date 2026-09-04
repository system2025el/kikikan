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
 * メモの最大文字数
 * t_juchu_kizai_head.mem / t_juchu_kizai_meisai.mem・mem2 / t_juchu_ctn_meisai.mem のカラム定義に合わせる
 */
export const MEMO_MAX_LENGTH = 200;

/**
 * 本番日の追加日数の整数部の桁数
 * t_juchu_kizai_honbanbi.juchu_honbanbi_add_qty が numeric(6,3) のため3桁
 */
export const HONBANBI_ADD_QTY_MAX_DIGITS = 3;

/**
 * 本番日の追加日数の小数部の桁数
 * 0.5日のような半日単位の入力を想定している
 */
export const HONBANBI_ADD_QTY_DECIMALS = 3;

/**
 * 本番日の追加日数の上限値（numeric(6,3) の最大）
 */
export const HONBANBI_ADD_QTY_MAX = 999.999;

/**
 * 辞書ID（dic_id）
 */
export const DIC_ID = {
  /** インデント文字 */
  indentChara: 1,
} as const;

/**
 * 受注添付ファイル（t_juchu_tempu / Storageバケット juchu-tempu）
 */
export const JUCHU_TEMPU = {
  /** バケット名。本番・ステージング共通 */
  bucket: 'juchu-tempu',
  /** 1ファイルの上限（20MB）。バケット側の file_size_limit と一致させること */
  maxSize: 20 * 1024 * 1024,
  /** 1受注あたりの添付件数の上限 */
  maxCount: 20,
  /** 署名付きURLの有効期限（秒）。PDFビューアの再読込に耐えるため長めにしている */
  signedUrlSec: 600,
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
