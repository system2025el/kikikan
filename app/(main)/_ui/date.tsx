'use client';

import 'dayjs/locale/ja';

import { grey } from '@mui/material/colors';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { subDays } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { FocusEvent, useMemo, useRef, useState } from 'react';
import { Noop } from 'react-hook-form';
import { DateRangePicker } from 'rsuite';

import { toJapanYMDString } from '../_lib/date-conversion';
//import { DateRange } from 'rsuite/esm/DateRangePicker';

dayjs.locale('ja'); // カレンダーの曜日のフォーマット

/**
 * クリアボタンの表示制御。
 * MUIXの既定は「マウス環境ではホバー/フォーカス時のみ表示」かつ「値が空でもボタン自体は描画する」ため、
 * 値があるときは常時表示、空のときは常に非表示になるよう上書きする。
 * @param visible 表示するかどうか（通常は値の有無）
 */
const clearButtonSx = (visible: boolean) => {
  const opacity = visible ? 1 : 0;

  return {
    '& .clearButton': { opacity },
    '@media (pointer: fine)': {
      '& .clearButton': { opacity },
      '&:hover, &:focus-within': { '.clearButton': { opacity } },
    },
  };
};

/**
 * カレンダーの表示単位
 */
export type CalendarView = 'year' | 'month' | 'day';

/**
 * 日付を選択するカレンダーコンポーネント
 * @param props value 選択中の日付 onChange 変更時の処理（第2引数は選択時の表示単位）
 * @returns {JSX.Element} MUIX DateCalendarコンポーネント
 */
export const Calendar = ({
  value,
  onChange,
}: {
  value?: Date | null;
  onChange?: (date: Date | null, view: CalendarView) => void;
}) => {
  const [view, setView] = useState<CalendarView>('day');

  return (
    <DateCalendar
      slotProps={{
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      value={value ? dayjs(value) : null}
      views={['year', 'month', 'day']}
      onChange={(newValue: Dayjs | null) => onChange?.(newValue ? newValue.toDate() : null, view)}
      onViewChange={(newView) => setView(newView)}
    />
  );
};

/**
 * 日時を選択し取得するコンポーネント
 * @param props sx スタイル disbled disabledかどうか
 * @returns {JSX.Element} MUIX DateTimePickerコンポーネント
 */
export const DateTime = ({
  sx,
  disabled,
  value,
  error,
  helperText,
  minDate,
  maxDate,
  timeSteps,
  notClearable,
  onChange,
  onAccept,
  onCommit,
}: {
  sx?: object;
  disabled?: boolean;
  value?: Date | null;
  error?: boolean;
  helperText?: string;
  minDate?: Date;
  maxDate?: Date;
  timeSteps?: number;
  notClearable?: boolean;
  onChange?: (date: Date | null) => void;
  onAccept?: (date: Date | null) => void;
  /**
   * ユーザーが入力を終えた時に1回だけ呼ばれる。
   * onAcceptは「値がまた変わった」という意味しか持たず、手入力ではセクションを1文字打つたびに
   * 発火する（年に「2」と打った時点で西暦2年という有効な日付が成立してしまうため）。
   * そのため重い処理をonAcceptに載せると入力が中断される。入力完了を起点にしたい処理はこちらを使う。
   * カレンダー操作（OK・カレンダー外クリック・Escape）は即座に、手入力はフィールドから
   * フォーカスが外れた時点で、最後の値で1回だけ呼ばれる。
   */
  onCommit?: (date: Date | null) => void;
}) => {
  /** 表示用に時間を丸める計算 */
  const roundedValue = useMemo(() => {
    if (!value) return null;
    const d = dayjs(value);
    const step = timeSteps ?? 5; // デフォルト値も考慮
    // 分数を取得
    const currentMinute = d.minute();
    // 四捨五入
    const roundedMinute = Math.round(currentMinute / step) * step;

    return d.minute(roundedMinute).second(0);
  }, [value, timeSteps]);

  /** カレンダーが開いているか（onAcceptがカレンダー由来か手入力由来かの判別に使う） */
  const isCalendarOpen = useRef(false);
  /** 手入力で確定を保留している値。フォーカスが外れた時にonCommitへ渡す */
  const pendingCommit = useRef<{ date: Date | null } | null>(null);

  return (
    <DateTimePicker
      name="date"
      format="YYYY/MM/DD HH:mm"
      timeSteps={{ minutes: timeSteps ?? 5 }}
      slotProps={{
        actionBar: { actions: ['accept', 'cancel'] },
        field: {
          clearable: notClearable ? false : true,
        },
        textField: {
          error,
          helperText,
          size: 'small',
          // 手入力の保留分を確定させる。年→月のようなセクション間の移動でもfocusoutは起きるため、
          // フォーカスの移動先がこのフィールドの外に出た時だけ「入力が終わった」とみなす
          onBlur: (event: FocusEvent<HTMLElement>) => {
            if (event.currentTarget.contains(event.relatedTarget)) return;
            const pending = pendingCommit.current;
            pendingCommit.current = null;
            if (pending) onCommit?.(pending.date);
          },
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 230,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...clearButtonSx(!!value),
            ...sx,
          },
        },
        toolbar: {
          hidden: true,
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      value={roundedValue}
      minDate={minDate && dayjs(minDate)}
      maxDate={maxDate && dayjs(maxDate)}
      views={['year', 'month', 'day', 'hours', 'minutes']}
      disabled={disabled}
      onChange={(newValue: Dayjs | null) => onChange?.(newValue ? newValue.toDate() : null)}
      onOpen={() => {
        isCalendarOpen.current = true;
      }}
      onClose={() => {
        isCalendarOpen.current = false;
      }}
      onAccept={(newValue: Dayjs | null) => {
        const newDate = newValue ? newValue.toDate() : null;
        onAccept?.(newDate);

        if (!onCommit) return;

        if (isCalendarOpen.current) {
          // カレンダー由来（OK・カレンダー外クリック・Escape）。この時点ではまだ閉じる前なので
          // isCalendarOpenはtrue。従来どおり即座に確定させる
          pendingCommit.current = null;
          onCommit(newDate);
        } else {
          // 手入力由来。1文字ごとにここへ来るため確定させず、フォーカスが外れるまで保留する
          pendingCommit.current = { date: newDate };
        }
      }}
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
  readonly,
  minDate,
  maxDate,
  notClearable,
  onChange,
  onBlur,
}: {
  sx?: object;
  disabled?: boolean;
  value?: Date | null;
  error?: boolean;
  helperText?: string;
  readonly?: boolean;
  minDate?: Date;
  maxDate?: Date;
  notClearable?: boolean;
  onChange?: (date: Date | null) => void;
  onBlur?: Noop;
}) => {
  return (
    <DatePicker
      name="date"
      format="YYYY/MM/DD" // テキストエリア内のフォーマット
      slotProps={{
        field: {
          clearable: notClearable ? false : true,
        },
        textField: {
          error,
          helperText,
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 190,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...clearButtonSx(!!value),
            pointerEvents: readonly ? 'none' : undefined,
            backgroundColor: readonly ? grey[200] : undefined,
            color: readonly ? '#888' : undefined,
            ...sx,
          },
          inputProps: readonly
            ? {
                readOnly: true,
                onFocus: (e: React.FocusEvent<HTMLInputElement>) => e.target.blur(), // フォーカスを外す
              }
            : undefined,
        },
        toolbar: {
          hidden: true,
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      views={['year', 'month', 'day']}
      maxDate={maxDate ? dayjs(toJapanYMDString(maxDate)) : undefined}
      minDate={minDate ? dayjs(toJapanYMDString(minDate)) : undefined}
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onChange={
        readonly
          ? () => {}
          : (newValue: Dayjs | null) => {
              onChange?.(newValue ? newValue.toDate() : null);
            }
      }
      onAccept={onBlur}
    />
  );
};
