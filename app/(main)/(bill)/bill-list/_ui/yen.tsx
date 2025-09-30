'use client';

import { TextField } from '@mui/material';
import { Controller,FieldPath, useFormContext } from 'react-hook-form';

import { BillHeadValues } from '../_lib/types';

/**
 *
 * @param param0 請求用
 * @returns
 */
export const ReadOnlyYenNumberElement = <TFieldName extends FieldPath<BillHeadValues>>({
  name,
}: {
  name: TFieldName;
}) => {
  const { control } = useFormContext<BillHeadValues>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={
            typeof field.value === 'number' && !isNaN(field.value)
              ? field.value >= 0
                ? `¥${Math.abs(field.value).toLocaleString()}`
                : `-¥${Math.abs(field.value).toLocaleString()}`
              : `¥0`
          }
          type="text"
          onFocus={(e) => {
            const rawValue = String(field.value ?? '');
            setTimeout(() => {
              e.target.value = rawValue;
            }, 1);
          }}
          onBlur={(e) => {
            const rawValue = e.target.value.replace(/[¥,]/g, '');
            const numericValue = Number(rawValue);
            field.onChange(numericValue);
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '');
            if (/^\d*$/.test(raw)) {
              field.onChange(Number(raw));
              e.target.value = raw;
            }
          }}
          sx={(theme) => ({
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: fieldState.error?.message && theme.palette.error.main,
            },
            '.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: fieldState.error?.message && theme.palette.error.main,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: fieldState.error?.message && theme.palette.error.main,
            },
            '& .MuiInputBase-input': {
              textAlign: 'right',
            },
            '.MuiFormHelperText-root': {
              color: theme.palette.error.main,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            pointerEvents: 'none', // クリック不可にする
            backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
            color: '#888',
          })}
          slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
};
