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
  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = date.getFullYear().toString();
  const month = pad((date.getMonth() + 1).toString());
  const day = pad(date.getDate().toString());
  const hour = pad(date.getHours().toString());
  const min = pad(date.getMinutes().toString());
  const sec = pad(date.getSeconds().toString());
  return `${year}/${month}/${day} ${hour}:${min}:${sec}`;
};

// yyyy/MM/dd
export const toISOStringYearMonthDay = (date: Date) => {
  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const year = date.getFullYear().toString();
  const month = pad((date.getMonth() + 1).toString());
  const day = pad(date.getDate().toString());
  return `${year}/${month}/${day}`;
};

// MM/dd
export const toISOStringMonthDay = (date: Date): string => {
  const pad = function (str: string): string {
    return ('0' + str).slice(-2);
  };
  const month = pad((date.getMonth() + 1).toString());
  const day = pad(date.getDate().toString());
  return `${month}/${day}`;
};
