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
  juchuKizaiHeadKbn: number;
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
  kizai_id: number;
  kizai_nam: string;
  planKizaiQty: number;
  plan_yobi_qty: number;
  plan_qty: number;
};
