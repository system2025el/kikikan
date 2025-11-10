export type NyukoListSearchValues = {
  juchuHeadId: number | null;
  shukoDat: Date | null;
  shukoBasho: number;
  section: string[];
};

export type NyukoTableValues = {
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
  nchkSagyoStsId: number;
  nchkSagyoStsNamShort: string;
  nyukoFixFlg: boolean;
};
