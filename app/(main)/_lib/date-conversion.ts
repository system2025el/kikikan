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
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = jstDate.getFullYear().toString();
  const month = pad((jstDate.getMonth() + 1).toString());
  const day = pad(jstDate.getDate().toString());
  const hour = pad(jstDate.getHours().toString());
  const min = pad(jstDate.getMinutes().toString());
  const sec = pad(jstDate.getSeconds().toString());
  return `${year}/${month}/${day} ${hour}:${min}:${sec}`;
};

// yyyy/MM/dd
export const toISOStringYearMonthDay = (date: Date) => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = jstDate.getFullYear().toString();
  const month = pad((jstDate.getMonth() + 1).toString());
  const day = pad(jstDate.getDate().toString());
  return `${year}/${month}/${day}`;
};

// MM/dd
export const toISOStringMonthDay = (date: Date): string => {
  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const month = pad((jstDate.getMonth() + 1).toString());
  const day = pad(jstDate.getDate().toString());
  return `${month}/${day}`;
};

// 日本時間にするやつ
export const toJapanTimeString = (input: Date | string | number = new Date()): string => {
  return dayjs(input).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm:ss');
};
