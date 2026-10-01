/**
 * 入出庫明細の到着・出発・解除が失敗した理由
 * 画面で文言を出し分けるため、サーバー側の処理は理由を返す
 */
export const NYUSHUKO_FIX_ERROR = {
  /** すでに全部確定済み（ほかの人が先に到着・出発した） */
  allFixed: 'allFixed',
  /** 確定が1件もない（ほかの人が先に解除した） */
  noneFixed: 'noneFixed',
  /** 不足・過剰がある（出発時に DB から取り直して確認した結果） */
  diff: 'diff',
  /** それ以外（DB エラーなど） */
  other: 'other',
} as const;

export type NyushukoFixErrorReason = (typeof NYUSHUKO_FIX_ERROR)[keyof typeof NYUSHUKO_FIX_ERROR];

/**
 * 到着・出発・解除の結果（Server Action の戻り値）
 */
export type NyushukoFixResult = { ok: true } | { ok: false; reason: NyushukoFixErrorReason };

/**
 * 業務上の理由で到着・出発・解除できないときに投げる例外
 * トランザクションの catch で ROLLBACK し、reason を戻り値に詰める
 * ※'use server' のファイルからはクラスを export できないため、このファイルに置く
 */
export class NyushukoFixError extends Error {
  readonly reason: NyushukoFixErrorReason;

  constructor(reason: NyushukoFixErrorReason, message: string) {
    super(message);
    this.name = 'NyushukoFixError';
    this.reason = reason;
  }
}

/**
 * 失敗した操作（文言の出し分け用）
 */
export type NyushukoFixAction = 'arrival' | 'arrivalRelease' | 'departure' | 'departureRelease';

/**
 * 失敗の理由ごとの警告ダイアログの文言
 * 理由が other のとき（または操作と理由の組み合わせが想定外のとき）は null。画面は今までどおり「〜に失敗しました」を出す
 * @param action 操作
 * @param reason 理由
 * @returns
 */
export const getNyushukoFixErrorMessage = (
  action: NyushukoFixAction,
  reason: NyushukoFixErrorReason
): { title: string; message: string } | null => {
  if (action === 'arrival' && reason === NYUSHUKO_FIX_ERROR.allFixed) {
    return { title: '到着済みです', message: 'すでに到着済みです。画面を開き直してください' };
  }
  if (action === 'arrivalRelease' && reason === NYUSHUKO_FIX_ERROR.noneFixed) {
    return { title: '到着解除済みです', message: 'すでに到着解除されています。画面を開き直してください' };
  }
  if (action === 'departure' && reason === NYUSHUKO_FIX_ERROR.allFixed) {
    return { title: '出発済みです', message: 'すでに出発済みです。画面を開き直してください' };
  }
  if (action === 'departure' && reason === NYUSHUKO_FIX_ERROR.diff) {
    return {
      title: '不足・過剰があります',
      message: '不足・過剰があるため、出発できません。画面を開き直してください',
    };
  }
  if (action === 'departureRelease' && reason === NYUSHUKO_FIX_ERROR.noneFixed) {
    return { title: '出発解除済みです', message: 'すでに出発解除されています。画面を開き直してください' };
  }
  return null;
};

/**
 * 例外から失敗の理由を取り出す（NyushukoFixError 以外は other）
 * @param e 例外
 * @returns
 */
export const toNyushukoFixErrorReason = (e: unknown): NyushukoFixErrorReason =>
  e instanceof NyushukoFixError ? e.reason : NYUSHUKO_FIX_ERROR.other;
