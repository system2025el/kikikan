/**
 * 一覧テーブルのカラムのタイプ
 */
export type OrderListTableValues = {
  juchuHeadId: number;
  juchuStsNam: string;
  koenNam: string;
  koenbashoNam: string;
  kokyakuNam: string;
  juchuDat: Date;
  juchuStrDat: Date;
  juchuEndDat: Date;
};

/**
 * 受注一覧検索用タイプ
 */
export type OrderSearchValues = {
  criteria?: number;
  selectedDate?: {
    value: string;
    range?: {
      from: Date | null;
      to: Date | null;
    };
  };
  customer?: number;
  listSort: { sort: string; order: string };
  stageName?: string;
  orderStartDate?: Date | null;
  orderFinishDate?: Date | null;
};
