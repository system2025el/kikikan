export const escapeLikeString = (str: string) => {
  // 「%」「_」「\」をバックスラッシュでエスケープ＋トリム
  return str.replace(/[\\%_]/g, '\\$&').trim();
};

export const escapeOrLikeString = (str: string) => {
  // 1段階目：LIKE用に「%」「_」「\」をエスケープ
  // 2段階目：.or()フィルタで値を囲むダブルクォートを閉じてしまわないよう、1段階目の結果に含まれる「\」と「"」を改めてエスケープ
  return str
    .replace(/[\\%_]/g, '\\$&')
    .replace(/["\\]/g, '\\$&')
    .trim();
};
