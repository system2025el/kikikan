// [計測用・コミットしない] 在庫確認画面の検索・日付変更の区間を Performance タブの Timings とコンソールに出す

const PREFIX = '在庫確認:';
/** [区間名, 始点の目印, 終点の目印 or ミリ秒] */
type Section = [string, string | number, string | number];

let kind: '検索' | '日付変更' | null = null;
let finished = true;
// 在庫の取得が終わってから計測を締めるまでの、画面（親）のコミットの回数と時刻
let commitCount = 0;
let firstCommit: number | null = null;
let lastCommit: number | null = null;

const mark = (name: string) => performance.mark(PREFIX + name);
const hasMark = (name: string) => performance.getEntriesByName(PREFIX + name).length > 0;

/**
 * 計測を始める（検索ボタン・日付変更の押下時）
 * @param k 操作の種類
 */
export const perfStart = (k: '検索' | '日付変更') => {
  kind = k;
  finished = false;
  commitCount = 0;
  firstCommit = null;
  lastCommit = null;
  performance.clearMarks();
  performance.clearMeasures();
  mark('開始');
};

/** 区間の目印を付ける */
export const perfMark = (name: '機材取得完了' | '在庫取得完了') => {
  if (!finished) mark(name);
};

/**
 * 画面（親）がコミットするたびに呼ぶ（useLayoutEffect から。DOM に反映した直後・画面に描く前）
 * 在庫の取得が終わってから計測を締めるまでの分だけ数える
 */
export const perfCommit = () => {
  if (finished || !hasMark('在庫取得完了')) return;
  const now = performance.now();
  commitCount++;
  firstCommit ??= now;
  lastCommit = now;
};

/**
 * 描画が画面に出たところで計測を締め、区間ごとの秒数をコンソールに出す
 * @param rowCount 機材の件数
 * @param dayCount 在庫の日数
 */
export const perfFinish = (rowCount: number, dayCount: number) => {
  if (finished || !hasMark('在庫取得完了')) return;
  finished = true;
  // 次のフレームの描画が終わってから記録する（コミット直後ではまだ画面に出ていない）
  requestAnimationFrame(() => {
    setTimeout(() => {
      mark('描画完了');
      const stockDone = performance.getEntriesByName(PREFIX + '在庫取得完了')[0].startTime;
      const drawDone = performance.getEntriesByName(PREFIX + '描画完了')[0].startTime;
      const first = firstCommit ?? drawDone;
      const last = lastCommit ?? drawDone;

      const sections: Section[] = [
        ...(kind === '検索'
          ? ([
              ['1 機材一覧の取得', '開始', '機材取得完了'],
              ['2 在庫の取得', '機材取得完了', '在庫取得完了'],
            ] as Section[])
          : ([['2 在庫の取得', '開始', '在庫取得完了']] as Section[])),
        ['3 描画', '在庫取得完了', '描画完了'],
        ['3a 最初の組み立て（React）', stockDone, first],
        [`3b その後の描き直し（${Math.max(commitCount - 1, 0)}回）`, first, last],
        ['3c レイアウト・画面への描き込みなど', last, drawDone],
        ['合計', '開始', '描画完了'],
      ];
      const result: Record<string, string> = {};
      for (const [label, start, end] of sections) {
        const measure = performance.measure(PREFIX + label, {
          start: typeof start === 'number' ? start : PREFIX + start,
          end: typeof end === 'number' ? end : PREFIX + end,
        });
        result[label] = (measure.duration / 1000).toFixed(2) + '秒';
      }
      console.log(`[計測] 在庫確認 ${kind} 機材${rowCount}件×${dayCount}日`);
      console.table(result);
    }, 0);
  });
};
