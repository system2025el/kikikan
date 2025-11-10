export type ShukoEqptDetailValues = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  juchuKizaiMeisaiId: number;
  nyushukoBashoId: number;
  nyushukoDat: string;
  sagyoKbnId: number;
  planQty: number;
  resultQty: number;
  resultAdjQty: number;
  kizaiId: number;
  kizaiNam: string | null;
  kizaiMem: string | null;
  bldCod: string | null;
  tanaCod: string | null;
  edaCod: string | null;
  ctnFlg: boolean | null;
  indentNum: number;
};

export type ShukoEqptDetailTableValues = {
  nyushukoBashoId: number;
  rfidDat: string | null;
  rfidDelFlg: number | null;
  rfidElNum: number | null;
  rfidKizaiSts: number | null;
  rfidMem: string | null;
  rfidShozokuId: number | null;
  rfidShozokuNam: string | null;
  rfidStsNam: string | null;
  rfidTagId: string | null;
  rfidUser: string | null;
};
