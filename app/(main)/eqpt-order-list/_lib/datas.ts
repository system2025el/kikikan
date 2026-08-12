import { EqptOrderSearchValues } from './types';

/** 検索条件の初期値 */
export const DEFAULT_SEARCH_VALUES: EqptOrderSearchValues = {
  radio: 'shuko',
  selectedDate: { value: '5', range: { from: null, to: null } },
  kokyaku: '',
  koenbashoNam: '',
  listSort: { sort: 'shuko', order: 'asc' },
};

/** ラヂオボタン用データ */
export const radioData = [
  { id: '1', label: '先月全て' },
  { id: '2', label: '今月全て' },
  { id: '3', label: '昨日' },
  { id: '4', label: '今日' },
  { id: '5', label: '今日以降' },
  { id: '6', label: '明日' },
  { id: '7', label: '明日以降' },
  { id: '8', label: '指定期間' },
];
