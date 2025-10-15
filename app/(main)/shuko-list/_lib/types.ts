export type ShukoListSearchValues = {
  juchuHeadId: number | null;
  shukoDat: Date | null;
  shukoBasho: number;
};

export type ShukoTableValues = {
  juchuHeadId: number;
  koenNam: string;
  nyushukoDat: string;
  nyushukoBashoId: number;
  juchuKizaiHeadIdv: string;
  headNamv: string;
  sectionNamv: string;
  kokyakuNam: string;
  sstbSagyoStsId: number;
  schkSagyoStsId: number;
};

export type ShukoKizai = {
  kizaiId: number;
  kizaiNam: string;
  planKizaiQty: number;
  planYobiQty: number;
  planQty: number;
};
