'use client';

import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ClearIcon from '@mui/icons-material/Clear';
import { IconButton } from '@mui/material';
import { grey } from '@mui/material/colors';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimeValidationError } from '@mui/x-date-pickers/models';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { ControllerFieldState, Noop } from 'react-hook-form';

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
          textField: {
            helperText: errorMessage,
            size: 'small',
            sx: {
              bgcolor: disabled ? grey[200] : 'white',
              '.Mui-disabled': {
                WebkitTextFillColor: 'black',
              },
              width: '25%',
              minWidth: 150,
              ...sx,
            },
          },
        }}
        onError={(newError) => setError(newError)}
        views={['hours', 'minutes']}
        format="HH:mm"
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
  time: Date | null;
  onBlur?: Noop;
  fieldstate?: ControllerFieldState;
  onChange: (value: Dayjs | null) => void;
  onClear?: () => void;
}) => {
  const { sx, disabled, time, onBlur, fieldstate, onChange, onClear } = props;

  const [open, setOpen] = useState(false);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ja">
      <TimePicker
        name="time"
        value={time && dayjs(time)}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        onChange={onChange}
        slotProps={{
          textField: {
            //helperText: fieldstate?.error?.message,
            FormHelperTextProps: {
              sx: { color: 'error.main', fontSize: '0.75rem' },
            },
            size: 'small',
            sx: {
              bgcolor: disabled ? grey[200] : 'white',
              '.Mui-disabled': {
                WebkitTextFillColor: 'black',
              },
              width: '25%',
              minWidth: 150,
              ...sx,
            },
            error: fieldstate?.invalid,
          },
        }}
        views={['hours', 'minutes']}
        format="HH:mm"
        timeSteps={{ minutes: 15 }}
        disabled={disabled ? true : false}
        onAccept={onBlur}
      />
    </LocalizationProvider>
  );
};
