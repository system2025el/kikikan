export type ShukoDetailValues = {
  juchuHeadId: number;
  juchuKizaiHeadKbn: number;
  nyushukoBashoId: number;
  nyushukoDat: string;
  sagyoKbnId: number;
  nyuryokuUser: string | null;
  juchuKizaiHeadIds: number[];
  nyushukoShubetuId: number;
  headNamv: string | null;
  koenNam: string | null;
  koenbashoNam: string | null;
  kokyakuNam: string | null;
  juchuDat: string | null;
  memv: string | null;
};

export type ShukoDetailTableValues = {
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
  planKizaiQty: number | null;
  planYobiQty: number | null;
  resultAdjQty: number | null;
  resultQty: number | null;
  sagyoKbnId: number | null;
  diff: number;
  ctnFlg: number | null;
  dspOrdNumMeisai: number | null;
  indentNum: number;
  mem2: string | null;
  /** 保存済み（false は画面で追加したまだ保存していないコンテナ） */
  saveFlag: boolean;
  /** 画面で削除したコンテナ（保存すると削除される） */
  delFlag: boolean;
};

/** コンテナ選択ダイアログの選択肢 */
export type ShukoCtnSelectionValues = {
  kizaiId: number;
  kizaiNam: string;
};

/** コンテナ保存の結果（失敗したときは画面に出す文言） */
export type ShukoCtnSaveResult = { ok: true; data: ShukoDetailTableValues[] } | { ok: false; message: string };

export type NyukoValues = {
  juchuKizaiHeadId: number;
  nyushukoDat: string;
};
