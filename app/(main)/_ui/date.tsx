'use client';

import 'dayjs/locale/ja';

import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateValidationError } from '@mui/x-date-pickers/models';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

dayjs.locale('ja'); // カレンダーの曜日のフォーマット

const today = dayjs();

const Date = () => {
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
        onError={(newError: any) => setError(newError)}
        views={['year', 'month', 'day']}
        sx={{ width: '25%' }}
      />
    </LocalizationProvider>
  );
};

export default Date;
