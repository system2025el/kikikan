import dayjs from 'dayjs';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { ShukoListSearchValues } from './types';

/** 検索条件の既定値。他画面からクエリを組み立てるときの土台にも使う */
export const DEFAULT_SHUKO_LIST_SEARCH: ShukoListSearchValues = {
  selectedDate: { value: '2', range: { from: null, to: null } },
  juchuHeadId: null,
  shukoBasho: 0,
  kokyaku: '',
  koenNam: '',
  section: [],
};

/** クエリが出庫一覧の検索条件を持っているかの判定に使うキー(buildShukoListQueryが必ず設定する) */
const REQUIRED_KEY = 'dateKbn';

/**
 * 検索条件をURLのクエリ文字列に変換する。
 * このクエリは openOrFocusTab のタブ同一判定（tab-focus.ts）にも使われるため、
 * 同じ検索条件からは必ず同じ文字列が得られなければならない。
 * 空値のキーは省き、配列は並びを固定すること（条件が同じなのに別タブが開いてしまう）。
 */
export const buildShukoListQuery = (values: ShukoListSearchValues): string => {
  const params = new URLSearchParams();

  params.set(REQUIRED_KEY, values.selectedDate.value);
  // 指定期間以外は日付の入力欄自体が出ないため、範囲はクエリに載せない
  if (values.selectedDate.value === '4') {
    if (values.selectedDate.range.from) params.set('from', toJapanYMDString(values.selectedDate.range.from, '-'));
    if (values.selectedDate.range.to) params.set('to', toJapanYMDString(values.selectedDate.range.to, '-'));
  }
  if (values.juchuHeadId) params.set('juchuHeadId', String(values.juchuHeadId));
  if (values.shukoBasho) params.set('shukoBasho', String(values.shukoBasho));
  if (values.kokyaku) params.set('kokyaku', values.kokyaku);
  if (values.koenNam) params.set('koenNam', values.koenNam);
  for (const section of [...values.section].sort()) {
    params.append('section', section);
  }

  return params.toString();
};

/**
 * 検索条件付きの出庫一覧のパスを組み立てる。他画面から出庫一覧を開くときに使う。
 * @param values 既定値からの差分のみ指定する
 */
export const buildShukoListPath = (values: Partial<ShukoListSearchValues>): string =>
  `/shuko-list?${buildShukoListQuery({ ...DEFAULT_SHUKO_LIST_SEARCH, ...values })}`;

/** クエリから数値を取り出す。URL直打ちで数値以外が入っていた場合は未指定として扱う */
const toNumber = (value: string | null): number | null => {
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

/**
 * URLのクエリを検索条件に戻す。
 * 検索条件を持たないクエリ（メニューからの遷移など）ならnullを返すので、
 * 呼び出し側でsessionStorageの前回条件にフォールバックさせる。
 */
export const parseShukoListQuery = (searchParams: URLSearchParams): ShukoListSearchValues | null => {
  if (!searchParams.has(REQUIRED_KEY)) return null;

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  return {
    selectedDate: {
      value: searchParams.get(REQUIRED_KEY) || DEFAULT_SHUKO_LIST_SEARCH.selectedDate.value,
      range: {
        from: from ? dayjs(from).toDate() : null,
        to: to ? dayjs(to).toDate() : null,
      },
    },
    juchuHeadId: toNumber(searchParams.get('juchuHeadId')),
    shukoBasho: toNumber(searchParams.get('shukoBasho')) ?? 0,
    kokyaku: searchParams.get('kokyaku') ?? '',
    koenNam: searchParams.get('koenNam') ?? '',
    section: searchParams.getAll('section'),
  };
};
