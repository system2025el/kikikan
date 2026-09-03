import { IdoDen } from '../../../../../../../../_lib/db/types/t-ido-den-type';
export type IdoDetailValues = {
  sagyoKbnId: number;
  nyushukoDat: string;
  sagyoSijiId: number;
  nyushukoBashoId: number;
};

/**
 * 移動明細1行に紐づく受注明細の1件
 * `v_ido_den3_lst.juchu_meisai`（jsonb配列）の1要素に対応する。
 * 受注が紐づかない行（juchuFlg = 0）では空配列になる。
 */
export type IdoJuchuMeisaiValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  /** 公演名（t_juchu_head.koen_nam） */
  koenNam: string;
  /** 明細名（t_juchu_kizai_head.head_nam） */
  headNam: string;
  /** この明細が予定している移動数。全件の合計が planJuchuQty と一致する */
  planQty: number;
};

export type IdoDetailTableValues = {
  idoDenId: number;
  sagyoKbnId: number;
  nyushukoDat: string;
  sagyosijiId: number;
  nyushukoBashoId: number;
  juchuFlg: number;
  juchuMeisai: IdoJuchuMeisaiValues[];
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  rfidYardQty: number;
  rfidKicsQty: number;
  planJuchuQty: number;
  planLowQty: number;
  planQty: number;
  resultAdjQty: number;
  resultQty: number;
  diffQty: number;
  ctnFlg: boolean;
  delFlag: boolean;
  saveFlag: boolean;
};

export type IdoEqptSelection = {
  kizaiId: number;
  kizaiNam: string;
  shozokuNam: string;
  bumonId: number;
  kizaiGrpCod: string;
  ctnFlg: boolean;
};

export type SelectedIdoEqptsValues = {
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  shozokuNam: string;
  kizaiGrpCod: string;
  dspOrdNum: number;
  rfidKicsQty: number;
  rfidYardQty: number;
  ctnFlg: boolean;
};
