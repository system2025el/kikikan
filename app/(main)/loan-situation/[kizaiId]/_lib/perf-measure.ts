// [計測用・コミットしない] 貸出状況画面の表示（ページの読み込み・日付変更・再表示）の区間を Performance タブの Timings とコンソールに出す
// ページの読み込みでは 0 がこのタブのページ読み込み開始（一覧から別タブで開くので、押した直後とほぼ同じ）

const PREFIX = '貸出状況:';
type Kind = 'ページの読み込み' | '日付変更' | '再表示';
/** [区間名, 始点（目印の名前 or ミリ秒）, 終点（同）] */
type Section = [string, string | number, string | number];

let kind: Kind = 'ページの読み込み';
let finished = false;
// 使用数の取得が終わってから計測を締めるまでの、画面（親）のコミットの回数と時刻
let commitCount = 0;
let firstCommit: number | null = null;
let lastCommit: number | null = null;

const hasMark = (name: string) => performance.getEntriesByName(PREFIX + name).length > 0;

/**
 * 日付変更・再表示の押下時に計測を始める（ページの読み込みは、読み込み開始が起点なので呼ばない）
 * @param k 操作の種類
 */
export const perfStart = (k: Exclude<Kind, 'ページの読み込み'>) => {
  kind = k;
  finished = false;
  commitCount = 0;
  firstCommit = null;
  lastCommit = null;
  performance.clearMarks();
  performance.clearMeasures();
  perfMark('開始');
};

/** 区間の目印を付ける */
export const perfMark = (name: string) => {
  if (!finished) performance.mark(PREFIX + name);
};

/**
 * 画面（親）がコミットするたびに呼ぶ（useLayoutEffect から。DOM に反映した直後・画面に描く前）
 * 使用数の取得が終わってから計測を締めるまでの分だけ数える
 */
export const perfCommit = () => {
  if (finished || !hasMark('使用数取得完了')) return;
  const now = performance.now();
  commitCount++;
  firstCommit ??= now;
  lastCommit = now;
};

/**
 * 描画が画面に出たところで計測を締め、区間ごとの秒数をコンソールに出す
 * @param rowCount 受注の行数
 * @param dayCount 日数
 */
export const perfFinish = (rowCount: number, dayCount: number) => {
  if (finished || !hasMark('使用数取得完了')) return;
  finished = true;
  // 次のフレームの描画が終わってから記録する（コミット直後ではまだ画面に出ていない）
  requestAnimationFrame(() => {
    setTimeout(() => {
      // perfMark は計測を締めた後は何もしないので、ここは直接付ける
      performance.mark(PREFIX + '描画完了');
      // サーバーがページの最初の1バイトを返した時点（ここまでがサーバー側の処理。page.tsx の機材・色の取得を含む）
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const responseStart = navigation?.responseStart ?? 0;
      const useDone = performance.getEntriesByName(PREFIX + '使用数取得完了')[0].startTime;
      const drawDone = performance.getEntriesByName(PREFIX + '描画完了')[0].startTime;
      const first = firstCommit ?? drawDone;
      const last = lastCommit ?? drawDone;

      const firstSections: Section[] =
        kind === 'ページの読み込み'
          ? [
              ['1a サーバーの応答（ページの取得）', 0, responseStart],
              ['1b JS読み込み・組み立て', responseStart, '取得開始'],
            ]
          : [['1 押してから取得開始まで', '開始', '取得開始']];
      const sections: Section[] = [
        ...firstSections,
        ['2 在庫・受注の取得', '取得開始', '在庫・受注取得完了'],
        ['3 使用数の取得', '在庫・受注取得完了', '使用数取得完了'],
        ['4 描画', '使用数取得完了', '描画完了'],
        ['4a 最初の組み立て（React）', useDone, first],
        [`4b その後の描き直し（${Math.max(commitCount - 1, 0)}回）`, first, last],
        ['4c レイアウト・画面への描き込みなど', last, drawDone],
        ['合計', kind === 'ページの読み込み' ? 0 : '開始', '描画完了'],
      ];
      const result: Record<string, string> = {};
      for (const [label, start, end] of sections) {
        const measure = performance.measure(PREFIX + label, {
          start: typeof start === 'number' ? start : PREFIX + start,
          end: typeof end === 'number' ? end : PREFIX + end,
        });
        result[label] = (measure.duration / 1000).toFixed(2) + '秒';
      }
      console.log(`[計測] 貸出状況 ${kind} 受注${rowCount}行×${dayCount}日`);
      console.table(result);
    }, 0);
  });
};
