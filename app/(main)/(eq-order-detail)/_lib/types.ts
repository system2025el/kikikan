export type DetailOerValues = {
  juchuHeadId: number;
  delFlg: number;
  juchuSts: number;
  juchuDat: Date;
  juchuRange: [Date, Date] | null;
  nyuryokuUser: string;
  koenNam: string;
  koenbashoNam: string | null;
  kokyaku: { kokyakuId: number; kokyakuNam: string; kokyakuRank: number };
  kokyakuTantoNam: string | null;
  mem: string | null;
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
  shozokuId: number;
  shozokuNam: string;
  kizaiId: number;
  kizaiTankaAmt: number;
  kizaiNam: string;
  planKizaiQty: number;
  planYobiQty: number;
  indentNum: number;
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
};
