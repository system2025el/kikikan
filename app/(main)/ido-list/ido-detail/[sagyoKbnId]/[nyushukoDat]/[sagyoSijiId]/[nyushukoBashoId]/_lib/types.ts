export type IdoDetailValues = {
  sagyoKbnId: number;
  nyushukoDat: string;
  sagyoSijiId: number;
  nyushukoBashoId: number;
};

/**
 * 移動明細の1行 = 1受注機材ヘッダー
 *
 * 同じ機材が複数の公演に紐づく場合は、公演ごとに1行ずつ並ぶ。
 * 受注に紐づかない手動追加の機材は juchuHeadId / juchuKizaiHeadId が 0 の1行だけ（重複なし）。
 */
export type IdoDetailTableValues = {
  idoDenId: number;
  sagyoKbnId: number;
  nyushukoDat: string;
  sagyosijiId: number;
  nyushukoBashoId: number;
  /** この明細に生きている受注があるか。0 なら手動追加行か受注削除後の行で、削除ボタンが出る */
  juchuFlg: number;
  /** 受注ヘッダーid。手動追加行は0（主キーにNULLを入れられないためのセンチネル） */
  juchuHeadId: number;
  /** 受注機材ヘッダーid。juchuHeadId とのペアで一意。手動追加行は0 */
  juchuKizaiHeadId: number;
  /** 公演名（t_juchu_head.koen_nam）。手動追加行は空 */
  koenNam: string;
  /** 明細名（t_juchu_kizai_head.head_nam）。手動追加行は空 */
  headNam: string;
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  /** 機材単位の所属数（明細に配分していないので同じ機材の行には同じ値が並ぶ） */
  rfidYardQty: number;
  rfidKicsQty: number;
  /** この明細の受注予定数 */
  planJuchuQty: number;
  /** 機材単位の最低数（在庫と同じく明細には配分していない） */
  planLowQty: number;
  planQty: number;
  resultAdjQty: number;
  resultQty: number;
  diffQty: number;
  ctnFlg: boolean;
  delFlag: boolean;
  saveFlag: boolean;
};

/**
 * 明細1行を一意に決めるキー
 *
 * 機材idだけでは足りない。同じ機材が複数の公演に紐づくと行が分かれるため、
 * 行の特定・更新・削除はすべてこの3点で行う。
 */
export type IdoDetailRowKey = {
  kizaiId: number;
  juchuHeadId: number;
  juchuKizaiHeadId: number;
};

/** 明細行のキーを文字列にする。React の key や Map のキーに使う */
export const toIdoRowKey = (row: IdoDetailRowKey): string =>
  `${row.kizaiId}-${row.juchuHeadId}-${row.juchuKizaiHeadId}`;

/** 2つの行が同じ明細を指しているか */
export const isSameIdoRow = (a: IdoDetailRowKey, b: IdoDetailRowKey): boolean =>
  a.kizaiId === b.kizaiId && a.juchuHeadId === b.juchuHeadId && a.juchuKizaiHeadId === b.juchuKizaiHeadId;

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
