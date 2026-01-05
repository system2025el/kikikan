import 'dayjs/locale/ja';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('ja');

/**
 * 日本時間の年月日時分文字列に変換する関数
 * @param {Date | string | number} input 引数無なら現在時刻 Date string number
 * @param {string} str 時間の間に入る記号
 * @returns {string} 日本時間の文字列 YYYY${str}MM${str}DD HH:mm
 */
export const toJapanTimeString = (input: Date | string | number = new Date(), str: string = '/'): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`YYYY${str}MM${str}DD HH:mm`);
};
/**
 * 日本時間の年月日文字列に変換する関数
 * @param {Date | string | number} input 引数無なら現在時刻 Date string number
 * @param {string} str 時間の間に入る記号
 * @returns {string} 日本時間の文字列 YYYY${str}MM${str}DD
 */
export const toJapanYMDString = (input: Date | string | number = new Date(), str: string = '/'): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`YYYY${str}MM${str}DD`);
};
/**
 * 日本時間の年月日曜日を文字列に変換する関数
 * @param {Date | string | number} input 引数無なら現在時刻 Date string number
 * @param {string} str 時間の間に入る記号
 * @returns {string} 日本時間の文字列 YYYY${str}MM${str}DD (dd)
 */
export const toJapanYMDAndDayString = (input: Date | string | number = new Date(), str: string = '/'): string => {
  return dayjs(input).tz('Asia/Tokyo').locale('ja').format(`YYYY${str}MM${str}DD (dd)`);
};
/**
 * 日本時間の月日文字列に変換する関数
 * @param {Date | string | number} input 引数無なら現在時刻 Date string number
 * @param {string} str 時間の間に入る記号
 * @returns {string} 日本時間の文字列 MM${str}DD
 */
export const toJapanMDString = (input: Date | string | number = new Date(), str: string = '/'): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`MM${str}DD`);
};

/**
 * 日本時間の文字列に変換する関数
 * @param input 引数無なら現在時刻 Date string number
 * @returns 日本時間の文字列 HH:mm
 */
export const toJapanHHmmString = (input: Date | string | number = new Date()): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`HH:mm`);
};

/**
 * 日本時間のtimestamp型 文字列に変換する関数
 * @param input 引数無なら現在時刻 Date string number
 * @returns {string} 日本時間の文字列 YYYY-MM-DD HH:mm:ss
 */
export const toJapanTimeStampString = (input: Date | string | number = new Date()): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`YYYY-MM-DD HH:mm:ss`);
};

/**
 * 日本時間の曜日に変換する関数
 * @param {Date | string | number} input 引数無なら現在時刻 Date string number
 * @returns {string} 日本時間の曜日の文字列
 */
export const toJapanDayString = (input: Date | string | number = new Date()): string => {
  return dayjs(input).tz('Asia/Tokyo').locale('ja').format(`dd`);
};
