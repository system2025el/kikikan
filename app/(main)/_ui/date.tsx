'use client';

import 'dayjs/locale/ja';

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

export const RSuiteDateRangePicker = () => {
  const [dateRange, setDateRange] = useState<[Date, Date]>([new Date(), new Date()]);
  return (
    <DateRangePicker
      style={{ width: 250 }}
      format="yyyy/MM/dd"
      size="lg"
      character=" - "
      placeholder="年/月/日 - 年/月/日"
      placement="autoVertical"
      value={dateRange}
      onOk={(date) => setDateRange(date)}
    />
  );
};
