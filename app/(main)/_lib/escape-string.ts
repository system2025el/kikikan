export const escapeLikeString = (str: string) => {
  // 「%」「_」「\」をバックスラッシュでエスケープ＋トリム
  return str.replace(/[\\%_]/g, '\\$&').trim();
};

export const escapeOrLikeString = (str: string) => {
  // 「%」「_」「\」をバックスラッシュでエスケープ＋トリム
  return str.replace(/[\\%_]/g, '\\\\$&').trim();
};
