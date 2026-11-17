/**
 * 入出庫状態色
 */
export const statusColors = {
  /**
   * 過剰（黄）
   */
  excess: 'rgba(255, 255, 0, 1)',
  /**
   * 不足（薄橙）
   */
  lack: 'rgba(255, 213, 160, 1)',
  /**
   * 済（グレー）
   */
  completed: 'rgba(192, 192, 192, 1)',
  /**
   * コンテナ（橙）
   */
  ctn: 'rgba(255, 171, 64, 1)',
  /**
   * 未保存（黄緑）
   *
   * 移動明細画面で「受注で作られただけで、まだ移動伝票として保存されていない行」。
   * この行があると出発できないので、どれが原因か分かるように色を付ける。
   * 移動数0・読取0だと差異0になって「済」と判定されてしまうため、済より先に判定すること。
   *
   * 過剰（純粋な黄）と隣り合うので、黄に寄せすぎず緑寄りにしている。
   */
  unsaved: 'rgba(204, 255, 144, 1)',
  /**
   * 受注削除（赤・文字色）
   * 受注から削除された（明細の削除・出庫場所の変更）のに実績が残っている＝現物を取り除く必要がある行
   * 行の背景ではなく機材名の文字色に使う（HT・ゲートと同じ見せ方。MUI の error.main と同値）
   */
  deleted: 'rgba(211, 47, 47, 1)',
  /**
   * 数量変更（文字色）
   * 読取実績のある状態で受注側の数量が変わり、まだ 予定数 = 読取数＋補正数 になっていない行（t_nyushuko_den.plan_chg_flg）
   * 受注削除と同じく機材名の文字色に使う。色は受注削除と同じ赤（2026-10-29 お客さんと決定）。定数は分けておく
   */
  planChanged: 'rgba(211, 47, 47, 1)',
};

/**
 * 到着・出発の確定状況の色（入出庫一覧の行、入出庫明細の「済」表示）
 * 同じ日時・場所に合体している受注機材ヘッダーのうち、全部確定済み／一部確定済み。確定なしは色なし（白）
 */
export const fixStsColors = {
  /**
   * 全部済（グレー）
   */
  all: '#808080',
  /**
   * 一部済（薄いグレー）
   */
  partial: 'rgba(224, 224, 224, 1)',
};

/**
 * 画面表示色
 */
export const dispColors = {
  /**
   * ホバー時の色
   */
  hover: 'rgba(0, 0, 0, 0.04)',
  /**
   * キープ
   */
  keep: 'green',
  /**
   * 返却
   */
  return: 'red',
  /**
   * 通常伝票
   */
  main: 'primary',
  /**
   * 事前（事前ピッキング・事前最終確認）。出庫一覧・事前の明細画面の明細名の文字色。
   * 文字色なので、HT・ゲートの一覧の背景色・在庫表の事前準備の期間（m_honbanbi_color の clolor_id = 4）の
   * #E8D5B7 より少し濃くしている
   */
  jizen: '#D2B48C',
  /**
   * 在庫マイナス（文字色）。在庫表・貸出状況で在庫数が0未満のセル
   */
  minusZaiko: 'red',
  /**
   * 在庫表の日付見出しのうち、出庫日〜入庫日の範囲に入る日（文字色）
   */
  dateInRange: 'blue',
  /**
   * 在庫表の日付見出しの範囲外の日（文字色）
   */
  dateOutOfRange: 'black',
};

/**
 * 読み取り専用の入力欄（見積・請求の金額欄、RFIDマスタのタグIDなど）。グレー背景で無効っぽく見せる
 */
export const readonlyColors = {
  /**
   * 背景
   */
  bg: '#f5f5f5',
  /**
   * 文字
   */
  text: '#888',
};

/**
 * 出庫一覧の行の背景（ピッキングと最終確認の作業状況）。到着・出発の確定状況（fixStsColors）が優先
 */
export const shukoListStsColors = {
  /**
   * ピッキング△・最終確認未（lavenderblush）
   */
  pickingPartial: '#fff0f5',
  /**
   * ピッキング〇・最終確認未（azure）
   */
  pickingDone: '#f0ffff',
  /**
   * ピッキング〇・最終確認△（lightskyblue）
   */
  confirmPartial: '#87cefa',
  /**
   * ピッキング〇・最終確認〇（mediumaquamarine）
   */
  confirmDone: '#66cdaa',
  /**
   * ピッキングが未or△なのに、最終確認が△or〇（黄）
   */
  confirmBeforePicking: '#ffff00',
};

/**
 * 在庫表のセル背景の既定色。本番日色マスタ（m_honbanbi_color）に該当の種別が無いときだけ使う
 */
export const honbanbiFallbackColors = {
  /**
   * 使用中（種別1）
   */
  use: '#ACB9CA',
  /**
   * 出庫日（種別2）
   */
  shuko: 'lightblue',
  /**
   * 入庫日（種別3）
   */
  nyuko: 'yellow',
};

/**
 * 作業区分色（出庫・入庫はハンディアプリと統一）
 *
 * 明細画面・詳細画面のタイトルとテーブルヘッダーの背景に使う。
 * 画面を開いた人が「いまどの作業の画面か」を色で判別できるようにするためのもの。
 */
export const sagyoKbnColors = {
  /**
   * 出庫ピッキング
   */
  shukoPicking: 'rgba(33, 150, 243, 1)',
  /**
   * 出庫最終確認
   */
  shukoConfirmation: 'rgba(255, 211, 207, 1)',
  /**
   * 入庫カウント
   */
  nyukoCount: 'rgba(255, 235, 59, 1)',
  /**
   * 移動（出庫・入庫とも共通。MUI の purple[400] と同値）
   */
  ido: 'rgba(171, 71, 188, 1)',
};

/**
 * 課の色（入出庫明細の機材名の背景。キーは m_section.section_id = m_kizai.section_num）
 * 所属無し（0）・未設定・ここに無い課は色なし（行の背景のまま）
 */
export const sectionColors: Record<number, string> = {
  /** Ⅰ課 */
  1: '#FFBCD9',
  /** Ⅱ課 */
  2: '#FDFD96',
  /** Ⅲ課 */
  3: '#DCD0FF',
  /** Ⅳ課 */
  4: '#80D2CB',
  /** Ⅴ課 */
  5: '#92B5F2',
};

export const weeklyColors = {
  /**
   * 積み
   */
  shuko: 'rgba(142, 170, 219, 1)',
  /**
   * 降ろし
   */
  nyuko: 'rgba(252, 228, 214, 1)',
  /**
   * KICKS (id: 1)
   */
  kics: 'rgba(255, 204, 255, 1)',
  /**
   * YARD (id: 2)
   */
  yard: 'white', // undefinedでもいいが念のため白に指定
  /**
   * 厚木 (id: 3)
   */
  atsugi: 'rgba(189, 215, 238, 1)',
};
