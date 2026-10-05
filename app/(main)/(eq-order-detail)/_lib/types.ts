export type DetailOerValues = {
  juchuHeadId: number;
  delFlg: number;
  juchuSts: number;
  juchuDat: Date;
  juchuRange: [Date, Date] | null;
  nyuryokuUser: string;
  koenNam: string;
  koenbashoNam: string | null;
  kokyaku: { kokyakuId: number; kokyakuNam: string /*kokyakuRank: number*/ };
  kokyakuTantoNam: string | null;
  mem: string | null;
  nebikiRat: number | null;
  nebikiAmt: number | null;
  zeiKbn: number;
};

export type OyaJuchuKizaiNyushukoValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  kicsShukoDat: Date | null;
  kicsNyukoDat: Date | null;
  yardShukoDat: Date | null;
  yardNyukoDat: Date | null;
};

export type OyaJuchuKizaiMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  mShozokuId: number;
  shozokuId: number;
  shozokuNam: string;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  planKizaiQty: number;
  planYobiQty: number;
  dspOrdNum: number;
  indentNum: number;
  mem: string | null;
  mem2: string | null;
};

export type OyaJuchuContainerMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  kizaiId: number;
  kizaiNam: string;
  planKicsKizaiQty: number;
  planYardKizaiQty: number;
  mem: string | null;
  dspOrdNum: number;
  indentNum: number;
};

/**
 * 返却・キープの受注機材ヘッダー新規保存の結果（Server Action の戻り値）
 * oyaNotFixed：親の受注機材ヘッダーが全場所出発済みではない（画面を開いた後に出発解除された）
 */
export type SaveNewChildJuchuKizaiHeadResult =
  | { ok: true; juchuKizaiHeadId: number }
  | { ok: false; reason: 'oyaNotFixed' };
