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
