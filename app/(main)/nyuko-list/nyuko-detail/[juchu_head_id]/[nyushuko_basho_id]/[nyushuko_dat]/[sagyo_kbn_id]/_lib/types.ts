export type NyukoDetailValues = {
  juchuHeadId: number;
  nyushukoBashoId: number;
  nyushukoDat: string;
  sagyoKbnId: number;
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
};
