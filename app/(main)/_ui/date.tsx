'use client';

import 'dayjs/locale/ja';
import 'rsuite/dist/rsuite.min.css';

import { Box, Button, Container, Tab, Tabs, TextField, Typography } from '@mui/material';
import { grey, purple } from '@mui/material/colors';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateValidationError } from '@mui/x-date-pickers/models';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { DateRangePicker } from 'rsuite';

dayjs.locale('ja'); // カレンダーの曜日のフォーマット

const today = dayjs();

const DateX = () => {
  const [error, setError] = useState<DateValidationError | null>(null);

  const errorMessage = useMemo(() => {
    switch (error) {
      case 'maxDate':
      case 'minDate': {
        return 'Please select a date';
      }

      case 'invalidDate': {
        return 'Your date is not valid';
      }

      default: {
        return '';
      }
    }
  }, [error]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      dateFormats={{ year: 'YYYY年', month: 'MM' }} // カレンダー内の年一覧のフォーマット
      adapterLocale="ja"
      localeText={{
        previousMonth: '前月を表示',
        nextMonth: '翌月を表示',
      }}
    >
      <DatePicker
        name="date"
        format="YYYY/MM/DD" // テキストエリア内のフォーマット
        slotProps={{
          textField: { helperText: errorMessage, size: 'small' },
          calendarHeader: { format: 'YYYY年MM月' },
        }} // カレンダーヘッダーのフォーマット
        defaultValue={today}
        onError={(newError: DateValidationError) => setError(newError)}
        views={['year', 'month', 'day']}
        sx={{ width: '25%', minWidth: 200 }}
      />
    </LocalizationProvider>
  );
};

export default DateX;

export const TwoDatePickers = () => {
  return (
    <>
      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        dateFormats={{ year: 'YYYY年', month: 'MM' }} // カレンダー内の年一覧のフォーマット
        adapterLocale="ja"
        localeText={{
          previousMonth: '前月を表示',
          nextMonth: '翌月を表示',
        }}
      >
        <DatePicker
          name="date"
          format="YYYY/MM/DD" // テキストエリア内のフォーマット
          slotProps={{
            textField: { size: 'small' },
            calendarHeader: { format: 'YYYY年MM月' },
          }} // カレンダーヘッダーのフォーマット
          defaultValue={today}
          views={['year', 'month', 'day']}
          sx={{ width: '15%', minWidth: 150 }}
        />
        ～
        <DatePicker
          name="date"
          format="YYYY/MM/DD" // テキストエリア内のフォーマット
          slotProps={{
            textField: { size: 'small' },
            calendarHeader: { format: 'YYYY年MM月' },
          }} // カレンダーヘッダーのフォーマット
          defaultValue={today}
          views={['year', 'month', 'day']}
          sx={{ width: '15%', minWidth: 150 }}
        />
      </LocalizationProvider>
    </>
  );
};

type DateRange = [Date, Date] | null;

type Props = {
  value: DateRange;
  onChange: (value: DateRange) => void;
};

export const RSuiteDateRangePicker = (props: Props) => {
  return (
    <DateRangePicker
      style={{ width: 250 }}
      format="yyyy/MM/dd"
      size="lg"
      character=" - "
      placeholder="年/月/日 - 年/月/日"
      placement="autoVertical"
      value={props.value}
      onOk={props.onChange}
    />
  );
};

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
