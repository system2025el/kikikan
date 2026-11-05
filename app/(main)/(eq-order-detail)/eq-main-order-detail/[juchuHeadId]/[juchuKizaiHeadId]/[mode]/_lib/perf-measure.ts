// [計測用・コミットしない] 初期表示の区間を Performance タブの Timings とコンソールに出す
// 0 はこのタブのページ読み込み開始（別タブで開くので、ボタンを押した直後とほぼ同じ）

const PREFIX = '明細表示:';
/** [区間名, 始点（目印の名前 or ミリ秒）, 終点（同）] */
type Section = [string, string | number, string | number];

let finished = false;
// 在庫の取得が終わってから計測を締めるまでの、明細画面（親）のコミットの回数と時刻
let commitCount = 0;
let firstCommit: number | null = null;
let lastCommit: number | null = null;

/**
 * 受注画面から同じタブのまま明細へ移るときの起点（クリックした時点）
 * この移り方ではページの読み込みが起きないので、0 が受注画面を開いた時刻のままになるため
 */
export const perfStartNavigation = () => {
  finished = false;
  commitCount = 0;
  firstCommit = null;
  lastCommit = null;
  performance.clearMarks();
  performance.clearMeasures();
  perfMark('クリック');
};

/** 区間の目印を付ける */
export const perfMark = (name: string) => {
  performance.mark(PREFIX + name);
};

const hasMark = (name: string) => performance.getEntriesByName(PREFIX + name).length > 0;

/**
 * 明細画面（親）がコミットするたびに呼ぶ（useLayoutEffect から。DOM に反映した直後・画面に描く前）
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
 * 初期表示の1回だけ（保存後の再取得などでは出さない）
 * @param rowCount 明細の件数（ログに添える）
 */
export const perfFinish = (rowCount: number) => {
  if (finished || !hasMark('在庫取得完了')) return;
  finished = true;
  // 次のフレームの描画が終わってから記録する（コミット直後ではまだ画面に出ていない）
  requestAnimationFrame(() => {
    setTimeout(() => {
      perfMark('描画完了');
      const fromClick = hasMark('クリック');
      // サーバーがページの最初の1バイトを返した時点（ここまでがサーバー側の処理。開発モードはページのコンパイルも含む）
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const responseStart = navigation?.responseStart ?? 0;
      const stockDone = performance.getEntriesByName(PREFIX + '在庫取得完了')[0].startTime;
      const drawDone = performance.getEntriesByName(PREFIX + '描画完了')[0].startTime;
      const first = firstCommit ?? drawDone;
      const last = lastCommit ?? drawDone;

      const firstSections: Section[] = fromClick
        ? [['1 画面の切り替え', 'クリック', '取得開始']]
        : [
            ['1a サーバーの応答（ページの取得）', 0, responseStart],
            ['1b JS読み込み・組み立て', responseStart, '取得開始'],
          ];
      const sections: Section[] = [
        ...firstSections,
        ['2 明細の取得', '取得開始', '明細取得完了'],
        ['3 在庫の取得', '明細取得完了', '在庫取得完了'],
        ['4 描画', '在庫取得完了', '描画完了'],
        ['4a 明細・在庫が入った最初の組み立て（React）', stockDone, first],
        [`4b その後の描き直し（${Math.max(commitCount - 1, 0)}回）`, first, last],
        ['4c レイアウト・画面への描き込みなど', last, drawDone],
        ['合計', fromClick ? 'クリック' : 0, '描画完了'],
      ];
      const result: Record<string, string> = {};
      for (const [label, start, end] of sections) {
        const measure = performance.measure(PREFIX + label, {
          start: typeof start === 'number' ? start : PREFIX + start,
          end: typeof end === 'number' ? end : PREFIX + end,
        });
        result[label] = (measure.duration / 1000).toFixed(2) + '秒';
      }
      // ロック確認（Server Action）が在庫の取得より後に終わると、4 はその待ちも含む
      const lock = performance.getEntriesByName(PREFIX + 'ロック確認完了')[0];
      if (lock) {
        result['（参考）ロック確認の完了'] =
          lock.startTime > stockDone
            ? `在庫の取得の ${((lock.startTime - stockDone) / 1000).toFixed(2)}秒後`
            : '在庫の取得より前';
      }
      console.log(`[計測] 明細 ${rowCount}件（${fromClick ? '受注画面からクリック' : 'ページの読み込み'}）`);
      console.table(result);
    }, 0);
  });
};
