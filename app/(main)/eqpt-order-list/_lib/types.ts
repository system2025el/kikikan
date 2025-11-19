/**
 * 一覧テーブルのカラムのタイプ
 */
export type EqptOrderListTableValues = {
  juchuHeadId: number;
  kizaiHeadId: number;
  headNam: string;
  headKbn: number;
  oyaJuchuKizaiHeadId: number | null;
  koenNam: string;
  koenbashoNam: string;
  kokyakuNam: string;
  yShukoDat: string | null;
  yNyukoDat: string | null;
  kShukoDat: string | null;
  kNyukoDat: string | null;
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
