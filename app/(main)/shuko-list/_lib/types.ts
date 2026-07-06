export type ShukoListSearchValues = {
  selectedDate: {
    value: string;
    range: {
      from: Date | null;
      to: Date | null;
    };
  };
  juchuHeadId: number | null;
  shukoBasho: number;
  kokyaku: string | null;
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
  nyuryokuUser: string;
  sstbPlanQty: number;
  schkPlanQty: number;
};

export type ShukoKizai = {
  kizai_id: number;
  kizai_nam: string;
  planKizaiQty: number;
  plan_yobi_qty: number;
  plan_qty: number;
  mem2: string;
};
