import { FAKE_NEW_ID } from './constants';

/**
 * 0であればnullに変換 移動するかも
 * @param value 変換したい値
 * @returns valueが0ならnull, 他はvalueを返す
 */
export const fakeToNull = <T>(value: T): T | null => (value === FAKE_NEW_ID ? null : value);
export const nullToFake = (v: number | null): number => {
  return v === null ? FAKE_NEW_ID : v;
};
