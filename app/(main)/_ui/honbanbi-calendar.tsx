'use client';

import { Box, Grid2, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  HONBANBI_ADD_QTY_MAX,
  HONBANBI_ADD_QTY_MAX_DIGITS,
  HONBANBI_SHUBETU_ID,
  MEMO_MAX_LENGTH,
} from '@/app/_lib/constants';

import { toJapanYMDAndDayString, toJapanYMDString } from '../_lib/date-conversion';
import { HonbanbiValues } from '../_lib/types';
import { validationMessages } from '../_lib/validation-messages';

/** ブラシで塗り分ける本番日種別（種別1〜3は入出庫日から自動生成されるためここでは扱わない） */
const SHUBETU_LIST = [
  { id: HONBANBI_SHUBETU_ID.shikomi, label: '仕込' },
  { id: HONBANBI_SHUBETU_ID.rh, label: 'RH' },
  { id: HONBANBI_SHUBETU_ID.gp, label: 'GP' },
  { id: HONBANBI_SHUBETU_ID.honban, label: '本番' },
];

/**
 * 他種別が入っている日を示すドットの直径(px)
 */
const DOT_SIZE = 8;

/**
 * 本番日リストを日付昇順（同日は種別昇順）に並べる
 * @param list 本番日リスト
 */
const sortHonbanbi = (list: HonbanbiValues[]) =>
  [...list].sort((a, b) => {
    const diff = a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime();
    return diff !== 0 ? diff : a.juchuHonbanbiShubetuId - b.juchuHonbanbiShubetuId;
  });

type HonbanbiDayProps = PickersDayProps & {
  selectedKeys?: Set<string>;
  otherShubetuMap?: Map<string, number[]>;
  brushColor?: string;
  shubetuColorMap?: Map<number, string>;
};

/**
 * カレンダーの1日分のセル。
 * 背景＝ブラシ中の種別で選択されているか、下部のドット＝他種別が入っている日。
 */
const HonbanbiDay = (props: HonbanbiDayProps) => {
  const { selectedKeys, otherShubetuMap, brushColor, shubetuColorMap, day, outsideCurrentMonth, ...other } = props;

  const key = toJapanYMDString(day.toDate());
  const selected = !outsideCurrentMonth && !!selectedKeys?.has(key);
  const others = outsideCurrentMonth ? [] : (otherShubetuMap?.get(key) ?? []);

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        selected={false}
        sx={
          selected
            ? {
                bgcolor: brushColor,
                color: 'text.primary',
                fontWeight: 'bold',
                border: '1px solid rgba(0, 0, 0, 0.3)',
                '&:hover, &:focus': { bgcolor: brushColor },
                // 閲覧のみでも選択状態が薄くならないようにする
                '&.Mui-disabled': { bgcolor: brushColor, color: 'text.primary' },
              }
            : undefined
        }
      />
      {others.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 1,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: '2px',
            pointerEvents: 'none',
          }}
        >
          {others.map((id) => (
            <Box
              key={id}
              sx={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: '50%',
                bgcolor: shubetuColorMap?.get(id) ?? 'grey.500',
                border: '1px solid rgba(0, 0, 0, 0.2)',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

type HonbanbiCalendarProps = {
  /** 表示・編集する本番日リスト */
  honbanbiList: HonbanbiValues[];
  /** 種別ID → 色 */
  shubetuColorMap: Map<number, string>;
  /** 閲覧のみ（明細画面など）。trueなら日付・追加日数・メモを変更できない */
  readOnly?: boolean;
  /** カレンダーの初期表示月。未指定なら最初の本番日、それも無ければ当月 */
  referenceDate?: Date | null;
  /** 変更時。readOnly のときは呼ばれない */
  onChange?: (list: HonbanbiValues[]) => void;
  /** 最初の編集時に呼ばれる。falseを返すと変更を適用しない（ロック取得失敗時など） */
  onBeforeEdit?: () => Promise<boolean>;
};

/**
 * 本番日をカレンダー上で直接指定するコンポーネント。
 * 種別をブラシとして選び、日付セルのクリックで追加／再クリックで削除する。
 * 変更は都度 onChange で親に返し、DBへの反映は画面の保存ボタンが行う。
 */
export const HonbanbiCalendar = ({
  honbanbiList,
  shubetuColorMap,
  readOnly,
  referenceDate,
  onChange,
  onBeforeEdit,
}: HonbanbiCalendarProps) => {
  // 塗る種別（ブラシ）
  const [shubetuId, setShubetuId] = useState<number>(HONBANBI_SHUBETU_ID.shikomi);
  // 編集前処理が済んでいるか
  const beforeEditDoneRef = useRef(false);
  // 編集前処理中のPromise（連続操作で多重に走らせないよう共有する）
  const beforeEditPromiseRef = useRef<Promise<boolean> | null>(null);

  // カレンダーの初期表示月
  const calendarStart = useMemo(() => {
    if (referenceDate) return dayjs(referenceDate);
    const sorted = sortHonbanbi(honbanbiList);
    return sorted.length > 0 ? dayjs(sorted[0].juchuHonbanbiDat) : dayjs();
    // 初期表示月は最初の描画時にだけ決めたいので honbanbiList の変化では追従させない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceDate]);

  // ブラシ中の種別で選択済みの日付
  const selectedKeys = useMemo(
    () =>
      new Set(
        honbanbiList
          .filter((d) => d.juchuHonbanbiShubetuId === shubetuId)
          .map((d) => toJapanYMDString(d.juchuHonbanbiDat))
      ),
    [honbanbiList, shubetuId]
  );

  // 日付 → ブラシ中以外の種別（セル下部のドット用）
  const otherShubetuMap = useMemo(() => {
    const map = new Map<string, number[]>();
    honbanbiList.forEach((d) => {
      if (d.juchuHonbanbiShubetuId === shubetuId) return;
      if (!SHUBETU_LIST.some((s) => s.id === d.juchuHonbanbiShubetuId)) return;

      const key = toJapanYMDString(d.juchuHonbanbiDat);
      const ids = map.get(key) ?? [];
      if (!ids.includes(d.juchuHonbanbiShubetuId)) {
        map.set(
          key,
          [...ids, d.juchuHonbanbiShubetuId].sort((a, b) => a - b)
        );
      }
    });
    return map;
  }, [honbanbiList, shubetuId]);

  // 全種別の一覧（追加日数・メモの入力欄）。ブラシの種別に関わらず日付順に並べる
  const rows = useMemo(() => sortHonbanbi(honbanbiList), [honbanbiList]);

  /**
   * 最初の編集時だけ onBeforeEdit を実行する
   */
  const ensureBeforeEdit = useCallback(async () => {
    if (!onBeforeEdit) return true;
    if (beforeEditDoneRef.current) return true;

    if (!beforeEditPromiseRef.current) {
      beforeEditPromiseRef.current = onBeforeEdit().then((result) => {
        beforeEditDoneRef.current = result;
        beforeEditPromiseRef.current = null;
        return result;
      });
    }
    return beforeEditPromiseRef.current;
  }, [onBeforeEdit]);

  /**
   * 変更を適用する。
   *
   * 追加日数・メモの変更で使う。常に同期的に反映する。
   * await を挟むと状態の更新が入力イベントより後になり、
   * 日本語入力の変換中に文字が確定してしまうため。
   * @param apply 変更後のリストを返す関数
   */
  const applyChange = useCallback(
    (apply: () => HonbanbiValues[]) => {
      if (readOnly || !onChange) return;

      onChange(apply());
    },
    [readOnly, onChange]
  );

  /**
   * 編集前処理を確認してから変更を適用する。
   *
   * 日付の追加・削除のときだけ使う。追加日数・メモの変更では確認しない。
   * @param apply 変更後のリストを返す関数
   */
  const applyDateChange = useCallback(
    (apply: () => HonbanbiValues[]) => {
      if (readOnly || !onChange) return;

      if (!onBeforeEdit || beforeEditDoneRef.current) {
        onChange(apply());
        return;
      }

      void ensureBeforeEdit().then((result) => {
        if (result) onChange(apply());
      });
    },
    [readOnly, onChange, onBeforeEdit, ensureBeforeEdit]
  );

  /**
   * 日付セル押下（未選択なら追加、選択済みなら削除）
   * @param date 押された日付
   */
  const handleToggleDate = (date: Date) => {
    const key = toJapanYMDString(date);
    const isSameCell = (d: HonbanbiValues) =>
      d.juchuHonbanbiShubetuId === shubetuId && toJapanYMDString(d.juchuHonbanbiDat) === key;

    applyDateChange(() => {
      if (honbanbiList.some(isSameCell)) {
        return honbanbiList.filter((d) => !isSameCell(d));
      }

      const added: HonbanbiValues = {
        juchuHonbanbiShubetuId: shubetuId,
        juchuHonbanbiDat: new Date(key),
        mem: '',
        juchuHonbanbiAddQty: 0,
      };
      return sortHonbanbi([...honbanbiList, added]);
    });
  };

  /**
   * 追加日数・メモの更新
   * @param targetShubetuId 対象の種別id
   * @param key 対象の日付キー
   * @param values 更新する値
   */
  const handleRowChange = (targetShubetuId: number, key: string, values: Partial<HonbanbiValues>) => {
    applyChange(() =>
      honbanbiList.map((d) =>
        d.juchuHonbanbiShubetuId === targetShubetuId && toJapanYMDString(d.juchuHonbanbiDat) === key
          ? { ...d, ...values }
          : d
      )
    );
  };

  return (
    <Box p={2}>
      <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" mb={2}>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={shubetuId}
          onChange={(_, value) => value !== null && setShubetuId(value)}
        >
          {SHUBETU_LIST.map((s) => (
            <ToggleButton
              key={s.id}
              value={s.id}
              sx={{
                minWidth: 64,
                bgcolor: shubetuColorMap.get(s.id),
                '&.Mui-selected, &.Mui-selected:hover': {
                  bgcolor: shubetuColorMap.get(s.id),
                  fontWeight: 'bold',
                  boxShadow: 'inset 0 0 0 2px rgba(0, 0, 0, 0.6)',
                },
              }}
            >
              {s.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box display="flex" gap={4} flexWrap="wrap" alignItems="flex-start">
        <DateCalendar
          value={null}
          referenceDate={calendarStart}
          views={['day']}
          readOnly={readOnly}
          onChange={(date) => date && handleToggleDate(date.toDate())}
          slots={{ day: HonbanbiDay }}
          slotProps={
            {
              calendarHeader: { format: 'YYYY年MM月' },
              day: {
                selectedKeys: selectedKeys,
                otherShubetuMap: otherShubetuMap,
                brushColor: shubetuColorMap.get(shubetuId),
                shubetuColorMap: shubetuColorMap,
              },
            } as never
          }
        />

        <Box flexGrow={1} minWidth={320}>
          {rows.length === 0 ? (
            <Typography color="text.secondary" py={2}>
              {readOnly ? '設定されていません' : 'カレンダーの日付をクリックして追加してください'}
            </Typography>
          ) : (
            <>
              <Grid2 container spacing={2} alignItems="center">
                <Grid2 size={2} maxWidth={70}>
                  <Typography>種別</Typography>
                </Grid2>
                <Grid2 size={3} maxWidth={150}>
                  <Typography>日付</Typography>
                </Grid2>
                <Grid2 size={2} maxWidth={80}>
                  <Typography>追加日数</Typography>
                </Grid2>
                <Grid2 size={5} maxWidth={250}>
                  <Typography>メモ</Typography>
                </Grid2>
              </Grid2>
              {rows.map((row) => {
                const key = toJapanYMDString(row.juchuHonbanbiDat);
                const shubetu = SHUBETU_LIST.find((s) => s.id === row.juchuHonbanbiShubetuId);
                const isMemOverMaxLength = (row.mem?.length ?? 0) > MEMO_MAX_LENGTH;
                const isAddQtyOverMax = (row.juchuHonbanbiAddQty ?? 0) > HONBANBI_ADD_QTY_MAX;
                return (
                  <Grid2
                    key={`${row.juchuHonbanbiShubetuId}-${key}`}
                    container
                    spacing={2}
                    alignItems="center"
                    py={0.5}
                  >
                    <Grid2 size={2} maxWidth={70}>
                      <Box
                        sx={{
                          bgcolor: shubetuColorMap.get(row.juchuHonbanbiShubetuId),
                          border: '1px solid rgba(0, 0, 0, 0.2)',
                          borderRadius: 1,
                          textAlign: 'center',
                          px: 1,
                        }}
                      >
                        <Typography fontSize="small">{shubetu?.label}</Typography>
                      </Box>
                    </Grid2>
                    <Grid2 size={3} maxWidth={150}>
                      <Typography>{toJapanYMDAndDayString(row.juchuHonbanbiDat)}</Typography>
                    </Grid2>
                    <Grid2 size={2} maxWidth={80}>
                      <TextField
                        value={row.juchuHonbanbiAddQty ?? 0}
                        // 入力欄が狭くエラーメッセージを置く余地がないため、
                        // 上限を超える値はそもそも受け付けない
                        onChange={(e) => {
                          const input = e.target.value;
                          if (!/^\d*$/.test(input)) return;
                          if (input !== '' && Number(input) > HONBANBI_ADD_QTY_MAX) return;

                          handleRowChange(row.juchuHonbanbiShubetuId, key, {
                            juchuHonbanbiAddQty: input === '' ? 0 : Number(input),
                          });
                        }}
                        type="tel"
                        disabled={readOnly}
                        onFocus={(e) => e.target.select()}
                        // 上限超えは入力できないため、DBの既存データが超えている場合のみ枠が赤くなる
                        error={isAddQtyOverMax}
                        slotProps={{ input: { inputMode: 'numeric' } }}
                        sx={{
                          width: '60px',
                          '& .MuiInputBase-input': { textAlign: 'right' },
                        }}
                      />
                    </Grid2>
                    <Grid2 size={5} maxWidth={250}>
                      <TextField
                        value={row.mem ?? ''}
                        onChange={(e) => handleRowChange(row.juchuHonbanbiShubetuId, key, { mem: e.target.value })}
                        disabled={readOnly}
                        fullWidth
                        error={isMemOverMaxLength}
                        helperText={isMemOverMaxLength ? validationMessages.maxStringLength(MEMO_MAX_LENGTH) : ''}
                      />
                    </Grid2>
                  </Grid2>
                );
              })}
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
};
