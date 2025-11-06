export type ShukoListSearchValues = {
  juchuHeadId: number | null;
  shukoDat: Date | null;
  shukoBasho: number;
  section: string[];
};

export type ShukoTableValues = {
  juchuHeadId: number;
  koenNam: string;
  koenbashoNam: string;
  nyushukoDat: string;
  nyushukoBashoId: number;
  juchuKizaiHeadIdv: string;
  headNamv: string;
  sectionNamv: string;
  kokyakuNam: string;
  sstbSagyoStsId: number;
  sstbSagyoStsNamShort: string;
  schkSagyoStsId: number;
  schkSagyoStsNamShort: string;
  shukoFixFlg: boolean;
};

export type ShukoKizai = {
  kizaiId: number;
  kizaiNam: string;
  planKizaiQty: number;
  planYobiQty: number;
  planQty: number;
};
