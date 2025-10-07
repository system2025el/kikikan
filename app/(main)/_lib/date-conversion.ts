import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

// yyyy/MM/dd HH:mm:ss Timezone
export const toISOStringWithTimezone = (date: Date): string => {
  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = date.getFullYear().toString();
  const month = pad((date.getMonth() + 1).toString());
  const day = pad(date.getDate().toString());
  const hour = pad(date.getHours().toString());
  const min = pad(date.getMinutes().toString());
  const sec = pad(date.getSeconds().toString());
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? '+' : '-';
  const tzHour = pad((tz / 60).toString());
  const tzMin = pad((tz % 60).toString());
  return `${year}/${month}/${day}T${hour}:${min}:${sec}${sign}${tzHour}:${tzMin}`;
};

// yyyy/MM/dd HH:mm:ss
export const toISOString = (date: Date): string => {
  return dayjs(date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss');
};

// yyyy/MM/dd
export const toISOStringYearMonthDay = (date: Date) => {
  return dayjs(date).tz('Asia/Tokyo').format('YYYY/MM/DD');
};

// MM/dd
export const toISOStringMonthDay = (date: Date): string => {
  return dayjs(date).tz('Asia/Tokyo').format('MM/DD');
};

/**
 * 日本時間の文字列に変換する関数
 * @param input 引数無なら現在時刻 Date string number
 * @returns {string} 日本時間の文字列
 */
export const toJapanTimeString = (input: Date | string | number = new Date(), str: string = '/'): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`YYYY${str}MM${str}DD HH:mm:ss`);
};
export const toJapanDateString = (input: Date | string | number = new Date(), str: string = '/'): string => {
  return dayjs(input).tz('Asia/Tokyo').format(`YYYY${str}MM${str}DD`);
};
