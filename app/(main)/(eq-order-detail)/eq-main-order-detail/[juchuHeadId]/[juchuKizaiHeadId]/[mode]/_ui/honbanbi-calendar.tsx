'use client';

import { Box, Grid2, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import { useCallback, useMemo, useRef, useState } from 'react';

import { HONBANBI_SHUBETU_ID } from '@/app/_lib/constants';
import { toJapanYMDAndDayString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

import { JuchuKizaiHonbanbiValues } from '../_lib/types';

/** ブラシで塗り分ける本番日種別（種別1〜3は明細画面の保存で自動生成されるためここでは扱わない） */
const SHUBETU_LIST = [
  { id: HONBANBI_SHUBETU_ID.shikomi, label: '仕込' },
  { id: HONBANBI_SHUBETU_ID.rh, label: 'RH' },
  { id: HONBANBI_SHUBETU_ID.gp, label: 'GP' },
  { id: HONBANBI_SHUBETU_ID.honban, label: '本番' },
];

/**
 * 本番日リストを日付昇順（同日は種別昇順）に並べる。
 * 先頭・末尾が出庫日/入庫日の入力可能範囲（maxDate/minDate）に使われるため、
 * 常に「最も早い日」「最も遅い日」が端に来るようにしておく。
 */
const sortHonbanbi = (list: JuchuKizaiHonbanbiValues[]) =>
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
                width: 5,
                height: 5,
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
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  shukoDate: Date | null;
  nyukoDate: Date | null;
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
  juchuHonbanbiDeleteList: JuchuKizaiHonbanbiValues[];
  shubetuColorMap: Map<number, string>;
  edit: boolean;
  onChange: (list: JuchuKizaiHonbanbiValues[], deleteList: JuchuKizaiHonbanbiValues[]) => void;
  lock: () => Promise<boolean | React.JSX.Element | undefined>;
};

/**
 * 本番日をカレンダー上で直接指定するコンポーネント。
 * 種別をブラシとして選び、日付セルのクリックで追加／再クリックで削除する。
 * 変更は都度 onChange で親に返し、DBへの反映は画面の保存ボタンが行う。
 */
export const HonbanbiCalendar = ({
  juchuHeadId,
  juchuKizaiHeadId,
  shukoDate,
  nyukoDate,
  juchuHonbanbiList,
  juchuHonbanbiDeleteList,
  shubetuColorMap,
  edit,
  onChange,
  lock,
}: HonbanbiCalendarProps) => {
  // 塗る種別（ブラシ）
  const [shubetuId, setShubetuId] = useState<number>(HONBANBI_SHUBETU_ID.shikomi);
  // ロック取得済みか
  const lockedRef = useRef(false);
  // ロック取得中のPromise（連続操作で多重に叩かないよう共有する）
  const lockPromiseRef = useRef<Promise<boolean> | null>(null);

  // カレンダーの初期表示月
  const referenceDate = useMemo(() => (shukoDate ? dayjs(shukoDate) : dayjs()), [shukoDate]);

  // ブラシ中の種別で選択済みの日付
  const selectedKeys = useMemo(
    () =>
      new Set(
        juchuHonbanbiList
          .filter((d) => d.juchuHonbanbiShubetuId === shubetuId)
          .map((d) => toJapanYMDString(d.juchuHonbanbiDat))
      ),
    [juchuHonbanbiList, shubetuId]
  );

  // 日付 → ブラシ中以外の種別（セル下部のドット用）
  const otherShubetuMap = useMemo(() => {
    const map = new Map<string, number[]>();
    juchuHonbanbiList.forEach((d) => {
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
  }, [juchuHonbanbiList, shubetuId]);

  // ブラシ中の種別の一覧（追加日数・メモの入力欄）
  const rows = useMemo(
    () =>
      juchuHonbanbiList
        .filter((d) => d.juchuHonbanbiShubetuId === shubetuId)
        .sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime()),
    [juchuHonbanbiList, shubetuId]
  );

  /**
   * 最初の編集時だけロックを取得する。
   * 取得できなければ親側で編集不可＋警告になるので、その場合は変更を適用しない。
   */
  const ensureLock = useCallback(async () => {
    if (lockedRef.current) return true;

    if (!lockPromiseRef.current) {
      lockPromiseRef.current = lock().then((result) => {
        lockedRef.current = !!result;
        lockPromiseRef.current = null;
        return !!result;
      });
    }
    return lockPromiseRef.current;
  }, [lock]);

  /**
   * ロックを確認してから変更を適用する
   * @param apply 変更後のリストを返す関数
   */
  const applyChange = useCallback(
    async (apply: () => [JuchuKizaiHonbanbiValues[], JuchuKizaiHonbanbiValues[]]) => {
      if (!(await ensureLock())) return;

      const [list, deleteList] = apply();
      onChange(list, deleteList);
    },
    [ensureLock, onChange]
  );

  /**
   * 日付セル押下（未選択なら追加、選択済みなら削除）
   * @param date 押された日付
   */
  const handleToggleDate = (date: Date) => {
    const key = toJapanYMDString(date);
    const isSameCell = (d: JuchuKizaiHonbanbiValues) =>
      d.juchuHonbanbiShubetuId === shubetuId && toJapanYMDString(d.juchuHonbanbiDat) === key;

    void applyChange(() => {
      if (juchuHonbanbiList.some(isSameCell)) {
        return [
          juchuHonbanbiList.filter((d) => !isSameCell(d)),
          [...juchuHonbanbiDeleteList, ...juchuHonbanbiList.filter(isSameCell)],
        ];
      }

      const added: JuchuKizaiHonbanbiValues = {
        juchuHeadId: juchuHeadId,
        juchuKizaiHeadId: juchuKizaiHeadId,
        juchuHonbanbiShubetuId: shubetuId,
        juchuHonbanbiDat: new Date(key),
        mem: '',
        juchuHonbanbiAddQty: 0,
      };
      // 一度消してから同じ日を入れ直した場合、削除リストに残っていると
      // 保存時にDELETE→UPDATE(0件)となって行が消えるため、削除リストから外す
      return [sortHonbanbi([...juchuHonbanbiList, added]), juchuHonbanbiDeleteList.filter((d) => !isSameCell(d))];
    });
  };

  /**
   * 追加日数・メモの更新
   * @param key 対象の日付キー
   * @param values 更新する値
   */
  const handleRowChange = (key: string, values: Partial<JuchuKizaiHonbanbiValues>) => {
    void applyChange(() => [
      juchuHonbanbiList.map((d) =>
        d.juchuHonbanbiShubetuId === shubetuId && toJapanYMDString(d.juchuHonbanbiDat) === key ? { ...d, ...values } : d
      ),
      juchuHonbanbiDeleteList,
    ]);
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
          referenceDate={referenceDate}
          views={['day']}
          disabled={!edit}
          // 出庫日〜入庫日の外は選べない（従来の minDate/maxDate と同じ制約）
          shouldDisableDate={(date) => {
            if (!shukoDate || !nyukoDate) return true;
            const key = toJapanYMDString(date.toDate());
            return key < toJapanYMDString(shukoDate) || key > toJapanYMDString(nyukoDate);
          }}
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
              {shukoDate && nyukoDate
                ? 'カレンダーの日付をクリックして追加してください'
                : '出庫日と入庫日を設定すると入力できます'}
            </Typography>
          ) : (
            <>
              <Grid2 container spacing={2} alignItems="center">
                <Grid2 size={4} maxWidth={150}>
                  <Typography>日付</Typography>
                </Grid2>
                <Grid2 size={2} maxWidth={80}>
                  <Typography>追加日数</Typography>
                </Grid2>
                <Grid2 size={6} maxWidth={250}>
                  <Typography>メモ</Typography>
                </Grid2>
              </Grid2>
              {rows.map((row) => {
                const key = toJapanYMDString(row.juchuHonbanbiDat);
                return (
                  <Grid2 key={key} container spacing={2} alignItems="center" py={0.5}>
                    <Grid2 size={4} maxWidth={150}>
                      <Typography>{toJapanYMDAndDayString(row.juchuHonbanbiDat)}</Typography>
                    </Grid2>
                    <Grid2 size={2} maxWidth={80}>
                      <TextField
                        value={row.juchuHonbanbiAddQty ?? 0}
                        onChange={(e) => handleRowChange(key, { juchuHonbanbiAddQty: Number(e.target.value) })}
                        type="number"
                        disabled={!edit}
                        onFocus={(e) => e.target.select()}
                        sx={{
                          width: '60px',
                          '& .MuiInputBase-input': { textAlign: 'right' },
                          '& input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                        }}
                      />
                    </Grid2>
                    <Grid2 size={6} maxWidth={250}>
                      <TextField
                        value={row.mem ?? ''}
                        onChange={(e) => handleRowChange(key, { mem: e.target.value })}
                        disabled={!edit}
                        fullWidth
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
