/**
 * 0であればnullに変換 移動するかも
 * @param value 変換したい値
 * @returns valueが0ならnull, 他はvalueを返す
 */
export const zeroToNull = <T>(value: T): T | null => (value === 0 ? null : value);
export const nullToZero = (v: number | null): number => {
  return v === null ? 0 : v;
};
