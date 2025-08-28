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
  nyushukoStsNam: string;
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
  customerSort?: string;
  stageName?: string;
  orderStartDate?: Date | null;
  orderFinishDate?: Date | null;
};
