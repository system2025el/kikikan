'use client';

import { Autocomplete, AutocompleteProps } from '@mui/material';
import { useState } from 'react';

/**
 * 開いた時点から選んだ値の文字が入っている Autocomplete（単一選択用）
 *
 * MUI の Autocomplete は、value で値を渡すと入力欄の文字を最初は空にし、
 * JavaScript が動き出してから（useEffect の中で）値の文字を入れる。
 * そのためサーバーで組み立てた画面では、表示されてから JavaScript が動くまで空欄に見える。
 * ここでは入力欄の文字（inputValue）をこの部品の中で持ち、最初から値の文字を入れておく。
 * 以後の文字の変更（入力・値の変更・blur での戻し）は MUI が onInputChange で知らせてくるので、それに合わせる。
 * 画面全体の state にすると1文字ごとに画面全体が描き直されるので、この部品の中に閉じている。
 */
export const PrefilledAutocomplete = <
  T,
  DisableClearable extends boolean | undefined = false,
  FreeSolo extends boolean | undefined = false,
>(
  props: AutocompleteProps<T, false, DisableClearable, FreeSolo>
) => {
  const { onInputChange, ...rest } = props;

  const [inputValue, setInputValue] = useState(() => {
    const value = props.value;
    if (value === null || value === undefined) return '';
    if (props.getOptionLabel) return props.getOptionLabel(value);
    // MUI の既定の getOptionLabel と同じ（label を持つものは label、それ以外は文字列にする）
    return typeof value === 'object' && 'label' in value ? String(value.label) : String(value);
  });

  return (
    <Autocomplete
      {...rest}
      inputValue={inputValue}
      onInputChange={(event, value, reason) => {
        setInputValue(value);
        onInputChange?.(event, value, reason);
      }}
    />
  );
};
