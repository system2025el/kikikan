'use client';

import 'dayjs/locale/ja';
import 'rsuite/dist/rsuite.min.css';

import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { DateValidationError } from '@mui/x-date-pickers/models';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

import { grey } from '@mui/material/colors';
import { DateRangePicker } from 'rsuite';

dayjs.locale('ja'); // カレンダーの曜日のフォーマット

const today = dayjs();

export const Calendar = () => {
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
      <DateCalendar
        slotProps={{
          calendarHeader: { format: 'YYYY年MM月' },
        }} // カレンダーヘッダーのフォーマット
        defaultValue={today}
        views={['year', 'month', 'day']}
      ></DateCalendar>
    </LocalizationProvider>
  );
};
/**
 * 日付を選択し取得するコンポーネント
 * @param props sx スタイル disbled disabledかどうか
 * @returns {JSX.Element} MUIX DatePickerコンポーネント
 */
const DateX = (props: { sx?: object; disabled?: boolean }) => {
  const [error, setError] = useState<DateValidationError | null>(null);
  const { sx, disabled } = props;
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
  console.log(`ttttttttttttttttttttttttttttttttttttt${today}`);

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
          textField: {
            helperText: errorMessage,
            size: 'small',
            sx: {
              bgcolor: disabled ? grey[300] : 'white',
            },
          },
          calendarHeader: { format: 'YYYY年MM月' },
        }} // カレンダーヘッダーのフォーマット
        defaultValue={null}
        onError={(newError: DateValidationError) => setError(newError)}
        views={['year', 'month', 'day']}
        disabled={disabled ? true : false}
        sx={{
          width: '25%',
          minWidth: 200,
          ...sx,
        }}
      />
    </LocalizationProvider>
  );
};

export default DateX;
/**
 * 2つ並んだ日付選択コンポーネント
 * @param props sx スタイルを決めるオブジェクト
 * @returns {JSX.Element} MUIX DatePicker × 2
 */
export const TwoDatePickers = (props: { sx?: object }) => {
  const { sx } = props;
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
          sx={{ width: '15%', minWidth: 150, ...sx }}
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
          sx={{ width: '15%', minWidth: 150, ...sx }}
        />
      </LocalizationProvider>
    </>
  );
};
/**
 * 日付幅を取得する時のデータ型
 */
type DateRange = [Date, Date] | null;
/**
 * RsuiteDateRangePickerのprops
 */
type Props = {
  /**
   * DateRagePickerで取得する日付幅の最初と最後の値の配列
   */
  value: DateRange;
  /**
   * 新しく選択したDateRangeをセットする関数
   * @param value DateRange型の新しい値
   * @returns void
   */
  onChange: (value: DateRange) => void;
  /**
   * コンポーネントのスタイル
   */
  styles?: object;
  /**
   * disabledかどうか
   */
  disabled: boolean;
};
/**
 * @param props props
 * @returns {JSX.Element} 日付幅を選ぶコンポーネントDateRangePicker (rsuite)
 */
export const RSuiteDateRangePicker = (props: Props) => {
  const { value, onChange, styles, disabled } = props;
  console.log(value);
  return (
    <>
      <style>
        {`
          .custom-date-range-picker.rs-picker-disabled .rs-picker-toggle {
            background-color: #000000 !important;
            color: #ffffff !important;
          }

          .custom-date-range-picker.rs-picker-disabled .rs-picker-toggle-input {
            background-color: #000000 !important;
            color: #ffffff !important;
          }
        `}
      </style>
      <DateRangePicker
        className="custom-date-range-picker"
        style={{ width: 250, ...styles }}
        format="yyyy/MM/dd"
        size="lg"
        character=" ～ "
        placeholder="年/月/日 - 年/月/日"
        placement="autoVertical"
        value={value}
        onOk={onChange}
        disabled={disabled ? true : false}
        /*calendarSnapping*/
      />
    </>
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
