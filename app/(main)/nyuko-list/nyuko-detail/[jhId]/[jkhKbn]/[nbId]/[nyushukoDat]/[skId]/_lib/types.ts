export type NyukoDetailValues = {
  juchuHeadId: number;
  juchuKizaiHeadKbn: number;
  nyushukoBashoId: number;
  nyushukoDat: string;
  sagyoKbnId: number;
  juchuKizaiHeadIds: number[];
  nyushukoShubetuId: number;
  headNamv: string | null;
  koenNam: string | null;
  koenbashoNam: string | null;
  kokyakuNam: string | null;
  juchuDat: string | null;
  memv: string | null;
};

export type NyukoDetailTableValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  juchuKizaiHeadKbn: number;
  headNamv: string | null;
  kizaiId: number;
  kizaiNam: string | null;
  koenNam: string | null;
  koenbashoNam: string | null;
  kokyakuNam: string | null;
  nyushukoBashoId: number;
  nyushukoDat: string;
  nyushukoShubetuId: number | null;
  planQty: number | null;
  resultAdjQty: number | null;
  resultQty: number | null;
  sagyoKbnId: number | null;
  diff: number;
  ctnFlg: number | null;
  dspOrdNumMeisai: number | null;
  indentNum: number;
  mem2: string | null;
};

/**
 * 返却の入庫明細の行を、親（メイン）の入庫伝票へ反映するときの量
 * 親から引く（戻す）量は after − before。到着は before = 前回引いた読取数・after = 今回の読取数、
 * 到着解除は before = 前回引いた読取数・after = 0
 */
export type OyaNyukoReflectItem = {
  /** 反映する返却の入庫伝票の行（到着は画面の行、到着解除は DB から取り直した行） */
  data: Pick<
    NyukoDetailTableValues,
    | 'juchuHeadId'
    | 'juchuKizaiHeadId'
    | 'juchuKizaiMeisaiId'
    | 'kizaiId'
    | 'nyushukoDat'
    | 'nyushukoBashoId'
    | 'ctnFlg'
    | 'dspOrdNumMeisai'
    | 'indentNum'
  >;
  /** これまでに到着で親から引いた読取数（t_nyushuko_den.nyuko_fix_qty、未反映は0） */
  before: number;
  /** この処理の後に親から引かれている状態にする読取数 */
  after: number;
};
