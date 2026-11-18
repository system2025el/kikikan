'use client';

import { TextField, Theme } from '@mui/material';
import { useState } from 'react';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

import { readonlyColors } from '@/app/(main)/_lib/colors';

/**
 * 円表示の文字列にする（例：¥1,000）
 * @param value フォームの値
 * @param sign 'minus' は常に「¥-」を付ける（値引きの欄）。'auto' は負の数だけ「¥-」を付ける
 */
const formatYen = (value: unknown, sign: 'plus' | 'minus' | 'auto') => {
  if (typeof value !== 'number' || isNaN(value)) return '¥0';
  const minus = sign === 'minus' || (sign === 'auto' && value < 0);
  return `¥${minus ? '-' : ''}${Math.abs(value).toLocaleString()}`;
};

/** エラー時に枠とメッセージを赤くし、数値を右寄せにする */
const yenFieldSx = (errorMessage: string | undefined) => (theme: Theme) => ({
  '.MuiOutlinedInput-notchedOutline': {
    borderColor: errorMessage && theme.palette.error.main,
  },
  '.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: errorMessage && theme.palette.error.main,
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: errorMessage && theme.palette.error.main,
  },
  '& .MuiInputBase-input': {
    textAlign: 'right',
  },
  '.MuiFormHelperText-root': {
    color: theme.palette.error.main,
  },
});

/**
 * 円の入力欄（見積・請求の単価・値引き・特別値引き・消費税）
 * フォーカス中は数字だけ、離れると「¥1,000」の形で表示する。保存する値は0以上の整数で、空欄は null
 * 入力中かどうかの状態はこの欄の中で持つ（画面全体や他の行を再描画しないため）
 * @param minus 値引きの欄。表示に「¥-」を付ける（値は正の数のまま）
 * @param selectOnFocus フォーカスしたときに全選択する（明細ヘッダーの値引きだけ。他の欄は今までどおりしない）
 */
export const YenInputField = <T extends FieldValues>({
  control,
  name,
  editable,
  minus = false,
  selectOnFocus = false,
}: {
  control: Control<T>;
  name: FieldPath<T>;
  editable: boolean;
  minus?: boolean;
  selectOnFocus?: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={isEditing ? (field.value ?? '') : formatYen(field.value, minus ? 'minus' : 'plus')}
          type="text"
          onFocus={(e) => {
            setIsEditing(true);
            const target = e.target;
            const rawValue = String(field.value ?? '');
            if (selectOnFocus) {
              // 数字だけの表示に切り替わってから全選択する
              setTimeout(() => {
                target.value = rawValue;
                target.select();
              }, 1);
            } else {
              target.value = rawValue;
            }
          }}
          onBlur={(e) => {
            const rawValue = e.target.value.replace(/[¥,]/g, '');
            // 空欄のまま何も入力されなかった場合は 0 ではなく null に戻し、
            // 未編集の値が誤って dirty 扱いになるのを防ぐ
            const numericValue = rawValue === '' ? null : Math.abs(Number(rawValue));
            field.onChange(numericValue);
            setIsEditing(false);
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '');
            if (/^\d*$/.test(raw)) {
              // 空欄になった場合は 0 ではなく null にし、値が0の状態から
              // バックスペースで消しても表示が0に戻ってしまわないようにする
              field.onChange(raw === '' ? null : Number(raw));
              e.target.value = raw;
            }
          }}
          sx={yenFieldSx(fieldState.error?.message)}
          helperText={fieldState.error?.message}
          disabled={!editable}
        />
      )}
    />
  );
};

/**
 * 円の読み取り専用欄（小計・中計・合計など、計算で決まる金額）
 * グレー背景でクリックできない。負の数は「¥-1,000」と表示する
 */
export const ReadOnlyYenField = <T extends FieldValues>({
  control,
  name,
}: {
  control: Control<T>;
  name: FieldPath<T>;
}) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={formatYen(field.value, 'auto')}
          type="text"
          sx={(theme) => ({
            ...yenFieldSx(fieldState.error?.message)(theme),
            pointerEvents: 'none', // クリック不可にする
            backgroundColor: readonlyColors.bg, // グレー背景で無効っぽく
            color: readonlyColors.text,
          })}
          slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
};
