'use client';

import 'dayjs/locale/ja';
import 'rsuite/dist/rsuite.min.css';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { DatePicker, DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickerValue } from '@mui/x-date-pickers/internals';
import { DateValidationError } from '@mui/x-date-pickers/models';
import { subDays } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { ControllerFieldState, ControllerRenderProps, FieldErrors, Noop, useFormContext } from 'react-hook-form';
import { DateRangePicker } from 'rsuite';
//import { DateRange } from 'rsuite/esm/DateRangePicker';

dayjs.locale('ja'); // カレンダーの曜日のフォーマット

const today = dayjs();

export const Calendar = (props: { date: Date; onChange: (value: Dayjs | null, view: string) => void }) => {
  const { date, onChange } = props;
  const [view, setView] = useState<'year' | 'month' | 'day'>('day');

  return (
    <DateCalendar
      slotProps={{
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      value={dayjs(date)}
      views={['year', 'month', 'day']}
      onChange={(value) => onChange(value, view)}
      onViewChange={(newView) => setView(newView)}
    ></DateCalendar>
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

  return (
    <DatePicker
      name="date"
      format="YYYY/MM/DD" // テキストエリア内のフォーマット
      slotProps={{
        textField: {
          helperText: errorMessage,
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: '25%',
            minWidth: 150,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...sx,
          },
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      defaultValue={today}
      onError={(newError: DateValidationError) => setError(newError)}
      views={['year', 'month', 'day']}
      disabled={disabled}
    />
  );
};

export default DateX;

/**
 * 日付を選択し取得するコンポーネント
 * @param props sx スタイル disbled disabledかどうか
 * @returns {JSX.Element} MUIX DatePickerコンポーネント
 */
export const TestDate = (props: {
  sx?: object;
  disabled?: boolean;
  date: Date | null;
  minDate?: Date;
  maxDate?: Date;
  onBlur?: Noop;
  fieldstate?: ControllerFieldState;
  onChange: (value: Dayjs | null) => void;
  onClear?: () => void;
}) => {
  const { sx, disabled, date, minDate, maxDate, onBlur, fieldstate, onChange, onClear } = props;

  //カレンダーの表示を制御する
  const [open, setOpen] = useState(false);

  return (
    <DatePicker
      name="date"
      format="YYYY/MM/DD" // テキストエリア内のフォーマット
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      slotProps={{
        textField: {
          helperText: fieldstate?.error?.message,
          FormHelperTextProps: {
            sx: { color: 'error.main', fontSize: '0.75rem' },
          },
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 160,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...sx,
          },
          error: fieldstate?.invalid,
          InputProps: {
            endAdornment: (
              <>
                {date && (
                  <IconButton size="small" sx={{ p: 0 }} onClick={onClear} disabled={disabled}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" sx={{ p: 0 }} onClick={() => setOpen(true)} disabled={disabled}>
                  <CalendarTodayIcon fontSize="small" />
                </IconButton>
              </>
            ),
          },
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      value={date && dayjs(date)}
      minDate={minDate && dayjs(minDate)}
      maxDate={maxDate && dayjs(maxDate)}
      views={['year', 'month', 'day']}
      disabled={disabled}
      onChange={onChange}
      onAccept={onBlur}
    />
  );
};

/**
 * 2つ並んだ日付選択コンポーネント
 * @param props sx スタイルを決めるオブジェクト
 * @returns {JSX.Element} MUIX DatePicker × 2
 */
export const TwoDatePickers = (props: { sx?: object; disabled?: boolean }) => {
  const { sx, disabled } = props;
  return (
    <>
      <DatePicker
        name="date"
        format="YYYY/MM/DD" // テキストエリア内のフォーマット
        slotProps={{
          textField: {
            size: 'small',
            sx: {
              width: '15%',
              minWidth: 150,
              ...sx,
              bgcolor: disabled ? grey[200] : 'white',
              '.Mui-disabled': {
                WebkitTextFillColor: 'black',
              },
              ...sx,
            },
          },
          calendarHeader: { format: 'YYYY年MM月' },
        }} // カレンダーヘッダーのフォーマット
        defaultValue={today}
        views={['year', 'month', 'day']}
        className="MuiDateText"
      />
      ～
      <DatePicker
        name="date"
        format="YYYY/MM/DD" // テキストエリア内のフォーマット
        slotProps={{
          textField: {
            size: 'small',
            sx: {
              width: '15%',
              minWidth: 150,
              ...sx,
              bgcolor: disabled ? grey[300] : 'white',
              '.Mui-disabled': {
                WebkitTextFillColor: 'black',
              },
              ...sx,
            },
          },
          calendarHeader: { format: 'YYYY年MM月' },
        }} // カレンダーヘッダーのフォーマット
        defaultValue={today}
        views={['year', 'month', 'day']}
      />
    </>
  );
};

export const DateTime = (props: {
  sx?: object;
  disabled?: boolean;
  date: Date | null;
  minDate?: Date;
  maxDate?: Date;
  fieldstate?: ControllerFieldState;
  onChange: (value: Dayjs | null) => void;
  onAccept: (value: Dayjs | null) => void;
  onClear?: () => void;
}) => {
  const { sx, disabled, date, minDate, maxDate, fieldstate, onChange, onAccept, onClear } = props;

  //カレンダーの表示を制御する
  const [open, setOpen] = useState(false);

  return (
    <DateTimePicker
      name="date"
      format="YYYY/MM/DD HH:mm"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      slotProps={{
        actionBar: { actions: ['accept', 'cancel'] },
        textField: {
          helperText: fieldstate?.error?.message,
          FormHelperTextProps: {
            sx: { color: 'error.main', fontSize: '0.75rem' },
          },
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 220,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...sx,
          },
          error: fieldstate?.invalid,
          InputProps: {
            endAdornment: (
              <>
                {date && (
                  <IconButton size="small" sx={{ p: 0 }} onClick={onClear} disabled={disabled}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton size="small" sx={{ p: 0 }} onClick={() => setOpen(true)} disabled={disabled}>
                  <CalendarTodayIcon fontSize="small" />
                </IconButton>
              </>
            ),
          },
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      value={date && dayjs(date)}
      minDate={minDate && dayjs(minDate)}
      maxDate={maxDate && dayjs(maxDate)}
      views={['year', 'month', 'day', 'hours', 'minutes']}
      disabled={disabled}
      onChange={onChange}
      onAccept={onAccept}
    />
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
  minDate?: Date | null;
  maxDate?: Date | null;
  onChange: (value: DateRange) => void;
  /**
   * コンポーネントのスタイル
   */
  styles?: object;
  /**
   * disabledかどうか
   */
  disabled?: boolean;
};
/**
 * @param props props
 * @returns {JSX.Element} 日付幅を選ぶコンポーネントDateRangePicker (rsuite)
 */
export const RSuiteDateRangePicker = (props: Props) => {
  const { value, minDate, maxDate, onChange, styles, disabled } = props;
  return (
    <>
      <style>
        {`
          .rs-input-group.rs-input-group-disabled {
            color: black;
          }

          .rs-input-group input.rs-input ~ .rs-input-group-addon {
            color: #9e9e9e;
          }

          .rs-input:disabled {
            background-color: #eeeeee;
          }

          .rs-picker-default.rs-picker .rs-input-group {
            border-color: #bdbdbd;
          }

          .rs-picker-default.rs-picker-disabled .rs-input-group {
            background-color: #eeeeee;
            border-color: #9e9e9e;
          }

          .rs-input-group.rs-input-group-inside-disabled .rs-input-group-addon {
            background-color: #eeeeee;
          }

          .error-picker .rs-picker-toggle {
            border: 1px solid red !important;
            border-radius: 4px;
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
        shouldDisableDate={(date) => {
          if (minDate && date < subDays(minDate, 1)) return true;
          if (maxDate && date > maxDate) return true;
          return false;
        }}
        onOk={onChange}
        disabled={disabled}
        cleanable
        /*calendarSnapping*/
      />
    </>
  );
};

/**
 * 日付を選択し取得するコンポーネント
 * @param props sx スタイル disbled disabledかどうか
 * @returns {JSX.Element} MUIX DatePickerコンポーネント
 */
export const FormDateX = ({
  sx,
  disabled,
  value,
  error,
  helperText,
  onChange,
}: {
  sx?: object;
  disabled?: boolean;
  value?: Date | null;
  error?: boolean;
  helperText?: string;
  onChange?: (date: Date | null) => void;
}) => {
  return (
    <DatePicker
      name="date"
      format="YYYY/MM/DD" // テキストエリア内のフォーマット
      slotProps={{
        field: {
          clearable: true,
        },
        textField: {
          error,
          helperText,
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 200,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...sx,
          },
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      views={['year', 'month', 'day']}
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onChange={(newValue: Dayjs | null) => {
        onChange!(newValue ? newValue.toDate() : null);
      }}
    />
  );
};

/**
 * 日付を選択し取得するコンポーネント
 * @param props sx スタイル disbled disabledかどうか
 * @returns {JSX.Element} MUIX DatePickerコンポーネント
 */
export const FormMonthX = ({
  sx,
  disabled,
  value,
  error,
  helperText,
  onChange,
}: {
  sx?: object;
  disabled?: boolean;
  value?: Date | null;
  error?: boolean;
  helperText?: string;
  onChange?: (date: Date | null) => void;
}) => {
  return (
    <DatePicker
      format="YYYY/MM"
      views={['year', 'month']}
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onChange={(newValue: Dayjs | null) => {
        onChange?.(newValue ? newValue.toDate() : null);
      }}
      slotProps={{
        textField: {
          error,
          helperText,
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 200,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...sx,
          },
        },
      }}
    />
  );
};
