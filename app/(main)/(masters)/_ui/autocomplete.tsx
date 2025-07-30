'use client';

import { Autocomplete, createFilterOptions, TextField } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

type OptionType = {
  id: number | undefined;
  label: string;
  inputValue?: string; // 自由入力対応
};

type FormAutoCompleteProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  options: OptionType[];
  disabled?: boolean;
};

export const FormAutoComplete = <T extends FieldValues>({
  control,
  name,
  options,
  disabled,
}: FormAutoCompleteProps<T>) => {
  const filter = createFilterOptions<OptionType>();

  return (
    <Controller
      name={name}
      control={control}
      disabled={disabled ? true : false}
      render={({ field }) => (
        <Autocomplete
          {...field}
          value={field.value || ''}
          onChange={(e, newValue) => {
            if (typeof newValue === 'string') {
              field.onChange({ id: undefined, label: newValue });
            } else if (newValue?.inputValue) {
              field.onChange({ id: undefined, label: newValue.inputValue });
            } else {
              field.onChange(newValue);
            }
          }}
          options={options}
          filterOptions={(opts, params) => {
            const filtered = filter(opts, params);
            const { inputValue } = params;
            const isExisting = opts.some((opt) => inputValue === opt.label);
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue,
                label: `Add "${inputValue}"`,
                id: -100,
              });
            }
            return filtered;
          }}
          renderOption={(props, option) => {
            const { key, ...rest } = props; // key を除外
            return (
              <li key={option.id} {...rest} style={option.id === 0 ? { color: grey[500] } : {}}>
                {option.label}
              </li>
            );
          }}
          getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.inputValue || opt.label)}
          freeSolo
          renderInput={(params) => <TextField {...params} sx={{ width: 250 }} />}
        />
      )}
    />
  );
};
