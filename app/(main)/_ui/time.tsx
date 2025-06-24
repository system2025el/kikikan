'use client';

import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeValidationError } from '@mui/x-date-pickers/models';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';

dayjs.locale('ja');

const Time = (props: { sx?: object; disabled?: boolean }) => {
  const { sx, disabled } = props;
  const [error, setError] = useState<TimeValidationError | null>(null);

  const errorMessage = useMemo(() => {
    switch (error) {
      case 'maxTime':
      case 'minTime': {
        return 'Please select a time';
      }

      case 'invalidDate': {
        return 'Your time is not valid';
      }

      default: {
        return '';
      }
    }
  }, [error]);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <TimePicker
        name="time"
        slotProps={{
          textField: { helperText: errorMessage, size: 'small' },
        }}
        onError={(newError) => setError(newError)}
        views={['hours', 'minutes']}
        format="HH:mm"
        sx={{ width: '25%', minWidth: 150, ...sx }}
        timeSteps={{ minutes: 15 }}
        disabled={disabled ? true : false}
      />
    </LocalizationProvider>
  );
};

export default Time;

export const TestTime = (props: {
  sx?: object;
  disabled?: boolean;
  time: Date;
  onChange: (value: Dayjs | null) => void;
}) => {
  const { sx, disabled, time, onChange } = props;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <TimePicker
        name="time"
        value={dayjs(time)}
        onChange={onChange}
        slotProps={{
          textField: { size: 'small' },
        }}
        views={['hours', 'minutes']}
        format="HH:mm"
        sx={{ width: '25%', minWidth: 150, ...sx }}
        timeSteps={{ minutes: 15 }}
        disabled={disabled ? true : false}
      />
    </LocalizationProvider>
  );
};
