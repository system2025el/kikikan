/**
 * ダッシュボード用のテーブル型
 */
//出庫時間未設定、車両未設定
export type DashboardTableValues = {
  calDat: string;
  kizaiHeadId: number | null;
  juchuHeadId: number | null;
  headNam: string | null;
  koenNam: string | null;
  koenbashoNam: string | null;
  kokyakuNam: string | null;
  yardShukoDat: string | null;
  kicsShukoDat: string | null;
  yardNyukoDat: string | null;
  kicsNyukoDat: string | null;
  headKbn: number;
};

//マイナス在庫
export type MinusZaikoValues = {
  kizaiId: number;
  kizaiNam: string | null;
  kizaiQty: number | null;
  kizaiNgQty: number | null;
  bumonNam: string | null;
  daibumonNam: string | null;
  delFlg: boolean | null;
  dspFlg: boolean | null;
  mem: string | null;
  regAmt: number | null;
  shozokuNam: string | null;
  shukeibumonNam: string | null;
};
