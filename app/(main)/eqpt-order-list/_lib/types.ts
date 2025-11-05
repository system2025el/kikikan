/**
 * 一覧テーブルのカラムのタイプ
 */
export type EqptOrderListTableValues = {
  juchuHeadId: number;
  kizaiHeadId: number;
  headNam: string;
  koenNam: string;
  koenbashoNam: string;
  kokyakuNam: string;
  yShukoDat: Date | null;
  yNyukoDat: Date | null;
  kShukoDat: Date | null;
  kNyukoDat: Date | null;
};

/**
 * 受注一覧検索用タイプ
 */
export type EqptOrderSearchValues = {
  range?: {
    from: Date | null;
    to: Date | null;
  };
  radio: 'shuko' | 'nyuko';
  juchuId?: number | null;
  headNam?: string | null;
  kokyaku?: number | null;
  koenNam?: string | null;
  koenbashoNam?: string | null;
  listSort: { sort: string; order: string };
};
