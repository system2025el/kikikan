export const escapeLikeString = (str: string) => {
  // 「%」「_」「\」をバックスラッシュでエスケープする
  return str.replace(/[\\%_]/g, '\\$&');
};
