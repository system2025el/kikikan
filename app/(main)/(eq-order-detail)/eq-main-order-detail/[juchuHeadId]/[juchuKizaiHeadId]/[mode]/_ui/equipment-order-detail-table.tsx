'use client';

import Delete from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { blue, grey, lightBlue } from '@mui/material/colors';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { BASHO_ID, SAGYO_SIJI_ID } from '@/app/_lib/constants';
import { stockColors } from '@/app/(main)/_lib/colors';
import { toJapanMDString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { openOrFocusTab } from '@/app/(main)/_lib/tab-focus';
import { DateTime, FormDateX } from '@/app/(main)/_ui/date';
import { MemoTooltip } from '@/app/(main)/(eq-order-detail)/_ui/memo-tooltip';

import { getDateHeaderBackgroundColor, getStockRowBackgroundColor } from '../_lib/colorselect';
import { getMeisaiShukoDat } from '../_lib/jizen';
import {
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../_lib/types';

type StockTableProps = {
  eqStockList: StockTableValues[][];
  dateRange: string[];
  // 行ごとの事前準備の期間（準備日〜出庫日の前日）。eqStockList と同じ並び
  jizenRanges: string[][];
  //juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
  shubetuColorMap: Map<number, string>;
  juchuColorMap: Map<string, string>;
  ref: React.RefObject<HTMLDivElement | null>;
};

const StockTableComponent: React.FC<StockTableProps> = ({
  eqStockList,
  dateRange,
  jizenRanges,
  shubetuColorMap,
  /*juchuHonbanbiList*/ juchuColorMap,
  ref,
}) => {
  return (
    <TableContainer
      ref={ref}
      style={{
        overflow: 'scroll',
        maxHeight: '80vh',
      }}
    >
      <Table stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList[0].map((data, index) => (
                <TableCell
                  key={index}
                  align={'right'}
                  size="small"
                  sx={{
                    borderBottom: '1px solid lightGray',
                    borderRight: '1px solid lightGray',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: getDateHeaderBackgroundColor(toJapanYMDString(data.calDat), dateRange),
                    paddingY: 0,
                    paddingX: 0.5,
                    height: '25px',
                  }}
                >
                  {toJapanMDString(data.calDat)}
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {eqStockList.length > 0 &&
            eqStockList.map((row, rowIndex) => (
              <StockTableRow
                key={rowIndex}
                row={row}
                index={rowIndex}
                dateRange={dateRange}
                jizenRange={jizenRanges[rowIndex] ?? EMPTY_RANGE}
                //juchuHonbanbiList={juchuHonbanbiList}
                shubetuColorMap={shubetuColorMap}
                juchuColorMap={juchuColorMap}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const StockTable = React.memo(StockTableComponent);
StockTable.displayName = 'StockTable';

/** 事前準備が無い行に渡す空配列（参照を固定して React.memo を効かせる） */
const EMPTY_RANGE: string[] = [];

export type StockTableRowProps = {
  row: StockTableValues[];
  index: number;
  dateRange: string[];
  jizenRange: string[];
  shubetuColorMap: Map<number, string>;
  juchuColorMap: Map<string, string>;
};

const StockTableRow = React.memo(
  ({ row, index, dateRange, jizenRange, shubetuColorMap, juchuColorMap }: StockTableRowProps) => {
    return (
      <TableRow>
        {row.map((cell, colIndex) => {
          const bgcolor = getStockRowBackgroundColor(cell.calDat, dateRange, shubetuColorMap, juchuColorMap);
          return (
            <TableCell
              key={colIndex}
              align={'right'}
              style={styles.row}
              sx={{
                borderLeft: colIndex === 0 ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                // 本番日・使用期間の色が無い日だけ、事前準備の期間を塗る
                bgcolor:
                  bgcolor === 'white' && jizenRange.includes(toJapanYMDString(cell.calDat))
                    ? stockColors.jizen
                    : bgcolor,
                color: cell.zaikoQty < 0 ? 'red' : 'black',
              }}
              size="small"
            >
              {cell.zaikoQty}
            </TableCell>
          );
        })}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row === nextProps.row &&
      prevProps.juchuColorMap === nextProps.juchuColorMap &&
      prevProps.jizenRange.join() === nextProps.jizenRange.join()
    );
  }
);

StockTableRow.displayName = 'StockTableRow';

type EqTableProps = {
  rows: JuchuKizaiMeisaiValues[];
  edit: boolean;
  shukoFixFlag: boolean;
  shukoDate: Date | null;
  // 事前準備日時の上限（明細の出庫場所の出庫日時）に使う
  kicsShukoDat: Date | null;
  yardShukoDat: Date | null;
  handleCellChange: (
    rowIndex: number,
    kizaiId: number,
    orderValue: number,
    spareValue: number,
    totalValue: number
  ) => void;
  handleJizenDatChange: (rowIndex: number, jizenDat: Date | null) => void;
  handleJizenQtyChange: (rowIndex: number, jizenQty: number) => void;
  handleEqSelect: (row: JuchuKizaiMeisaiValues) => void;
  handleEqAllSelect: () => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleMemo2Change: (rowIndex: number, memo: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
};

const EqTableComponent: React.FC<EqTableProps> = ({
  rows,
  edit,
  shukoFixFlag,
  shukoDate,
  kicsShukoDat,
  yardShukoDat,
  handleCellChange,
  handleJizenDatChange,
  handleJizenQtyChange,
  handleEqSelect,
  handleEqAllSelect,
  handleMemoChange,
  handleMemo2Change,
  ref,
}) => {
  const inputOrderRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputYobiRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputJizenRefs = useRef<(HTMLInputElement | null)[]>([]);
  // rowIndexごとのref用コールバックをキャッシュし、React.memoが効くよう参照を固定する
  const orderRefCallbacks = useRef(new Map<number, (el: HTMLInputElement | null) => void>());
  const yobiRefCallbacks = useRef(new Map<number, (el: HTMLInputElement | null) => void>());
  const jizenRefCallbacks = useRef(new Map<number, (el: HTMLInputElement | null) => void>());

  const visibleRows = rows.filter((row) => !row.delFlag);

  const handleOrderKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex]?.focus();
    }
  }, []);

  const handleOrderRef = useCallback((rowIndex: number) => {
    let callback = orderRefCallbacks.current.get(rowIndex);
    if (!callback) {
      callback = (el: HTMLInputElement | null) => {
        inputOrderRefs.current[rowIndex] = el;
      };
      orderRefCallbacks.current.set(rowIndex, callback);
    }
    return callback;
  }, []);

  const handleYobiKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      // 準備日時が無い行は準備が入力不可なので、移動しない
      const jizenInput = inputJizenRefs.current[rowIndex];
      if (jizenInput && !jizenInput.disabled) jizenInput.focus();
    }
  }, []);

  const handleYobiRef = useCallback((rowIndex: number) => {
    let callback = yobiRefCallbacks.current.get(rowIndex);
    if (!callback) {
      callback = (el: HTMLInputElement | null) => {
        inputYobiRefs.current[rowIndex] = el;
      };
      yobiRefCallbacks.current.set(rowIndex, callback);
    }
    return callback;
  }, []);

  /**
   * 準備の入力欄で上下に移動する
   * 準備日時が無い行は入力不可なので飛ばし、次に入力できる行へ移る
   * @param rowIndex 起点の行
   * @param step 1:下 -1:上
   */
  const focusJizen = (rowIndex: number, step: 1 | -1) => {
    const refs = inputJizenRefs.current;
    for (let i = rowIndex + step; i >= 0 && i < refs.length; i += step) {
      const el = refs[i];
      if (el && !el.disabled) {
        el.focus();
        return;
      }
    }
  };

  const handleJizenKeyDown = useCallback((e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusJizen(rowIndex, 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusJizen(rowIndex, -1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex]?.focus();
    }
  }, []);

  const handleJizenRef = useCallback((rowIndex: number) => {
    let callback = jizenRefCallbacks.current.get(rowIndex);
    if (!callback) {
      callback = (el: HTMLInputElement | null) => {
        inputJizenRefs.current[rowIndex] = el;
      };
      jizenRefCallbacks.current.set(rowIndex, callback);
    }
    return callback;
  }, []);
  return (
    <TableContainer
      ref={ref}
      style={{
        overflow: 'scroll',
        maxHeight: '80vh',
      }}
    >
      <Table stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                padding: 0,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              <Checkbox
                indeterminate={
                  visibleRows &&
                  visibleRows.filter((d) => d.selected).length > 0 &&
                  visibleRows.filter((d) => d.selected).length < visibleRows.length
                }
                checked={
                  visibleRows &&
                  visibleRows.length > 0 &&
                  visibleRows.filter((d) => d.selected).length === visibleRows.length
                }
                onChange={handleEqAllSelect}
                sx={{
                  padding: 0,
                  '& .MuiSvgIcon-root': {
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s',
                  },
                }}
                disabled={!edit || shukoFixFlag}
              />
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              受注
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              予備
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              準備日時
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              準備
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              連絡
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <EqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              shukoFixFlag={shukoFixFlag}
              shukoDate={shukoDate}
              jizenMaxDat={getMeisaiShukoDat(row, kicsShukoDat, yardShukoDat)}
              handleOrderRef={handleOrderRef(rowIndex)}
              handleYobiRef={handleYobiRef(rowIndex)}
              handleJizenRef={handleJizenRef(rowIndex)}
              handleMemoChange={handleMemoChange}
              handleMemo2Change={handleMemo2Change}
              handleOrderKeyDown={handleOrderKeyDown}
              handleYobiKeyDown={handleYobiKeyDown}
              handleJizenKeyDown={handleJizenKeyDown}
              handleCellChange={handleCellChange}
              handleJizenDatChange={handleJizenDatChange}
              handleJizenQtyChange={handleJizenQtyChange}
              handleEqSelect={handleEqSelect}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const EqTable = React.memo(EqTableComponent);
EqTable.displayName = 'EqTable';

type EqTableRowProps = {
  row: JuchuKizaiMeisaiValues;
  rowIndex: number;
  edit: boolean;
  shukoFixFlag: boolean;
  shukoDate: Date | null;
  jizenMaxDat: Date | null;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleYobiRef: (el: HTMLInputElement | null) => void;
  handleJizenRef: (el: HTMLInputElement | null) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleMemo2Change: (rowIndex: number, memo: string) => void;
  handleCellChange: (
    rowIndex: number,
    kizaiId: number,
    planKizaiQty: number,
    planYobiQty: number,
    planQty: number
  ) => void;
  handleJizenDatChange: (rowIndex: number, jizenDat: Date | null) => void;
  handleJizenQtyChange: (rowIndex: number, jizenQty: number) => void;
  handleOrderKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
  handleYobiKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
  handleJizenKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
  handleEqSelect: (row: JuchuKizaiMeisaiValues) => void;
};

/**
 * 準備日時のセル
 * 日付部品は値を親が持つ前提で、カレンダーで選ぶたびに onChange で新しい値を返してもらう必要がある。
 * 明細への反映（在庫の取り直しを伴う）は確定時だけにしたいので、選択中の値はこのセルで持つ
 * @param value 準備日時（明細の値）
 * @param maxDate 選択できる最後の日（明細の出庫場所の出庫日時）
 * @param disabled 入力不可
 * @param onCommit 確定時
 */
const JizenDatCell = ({
  value,
  maxDate,
  disabled,
  onCommit,
}: {
  value: Date | null;
  maxDate: Date | null;
  disabled: boolean;
  onCommit: (date: Date | null) => void;
}) => {
  const [draft, setDraft] = useState<Date | null>(value);
  // 一括設定や解除など、外から明細の値が変わったら合わせる
  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <DateTime
      sx={{
        width: 175,
        '& .MuiPickersInputBase-root': {
          height: '23px',
          fontSize: 'small',
        },
        '& .MuiPickersSectionList-root': {
          padding: 0,
        },
        '& .MuiButtonBase-root': {
          padding: 0,
        },
      }}
      value={draft}
      maxDate={maxDate ?? undefined}
      onChange={setDraft}
      onCommit={onCommit}
      disabled={disabled}
    />
  );
};

const EqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    shukoFixFlag,
    shukoDate,
    jizenMaxDat,
    handleOrderRef,
    handleYobiRef,
    handleJizenRef,
    handleMemoChange,
    handleMemo2Change,
    handleCellChange,
    handleJizenDatChange,
    handleJizenQtyChange,
    handleOrderKeyDown,
    handleYobiKeyDown,
    handleJizenKeyDown,
    handleEqSelect,
  }: EqTableRowProps) => {
    return (
      <TableRow hover>
        <TableCell
          sx={{
            padding: 0,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          <Checkbox
            color="primary"
            checked={row.selected}
            onChange={() => handleEqSelect(row)}
            sx={{ padding: 0 }}
            disabled={!edit || shukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip
            name={row.kizaiNam}
            memo={row.mem ? row.mem : ''}
            handleMemoChange={handleMemoChange}
            rowIndex={rowIndex}
            disabled={!edit || shukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button
            variant="text"
            sx={{ p: 0, justifyContent: 'start', textTransform: 'none', color: 'text.primary' }}
            onClick={() =>
              openOrFocusTab(`/loan-situation/${row.kizaiId}?date=${shukoDate ? shukoDate.toISOString() : ''}`)
            }
          >
            {row.kizaiNam}
          </Button>
        </TableCell>
        <TableCell
          style={styles.row}
          align="right"
          size="small"
          sx={{ bgcolor: lightBlue[100], color: row.planQty === 0 ? 'red' : 'inherit' }}
        >
          {row.planQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planKizaiQty}
            type="tel"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleCellChange(rowIndex, row.kizaiId, Number(e.target.value), row.planYobiQty, row.planQty);
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            inputRef={handleOrderRef}
            onKeyDown={(e) => {
              handleOrderKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit || shukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planYobiQty}
            type="tel"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleCellChange(rowIndex, row.kizaiId, row.planKizaiQty, Number(e.target.value), row.planQty);
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            inputRef={handleYobiRef}
            onKeyDown={(e) => {
              handleYobiKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit || shukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} size="small">
          <JizenDatCell
            value={row.jizenDat ?? null}
            maxDate={jizenMaxDat}
            onCommit={(date) => handleJizenDatChange(rowIndex, date)}
            disabled={!edit || shukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.jizenQty ?? ''}
            type="tel"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleJizenQtyChange(rowIndex, Number(e.target.value));
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            inputRef={handleJizenRef}
            onKeyDown={(e) => {
              handleJizenKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            // 準備日時が無い行は準備数を持たない
            disabled={!edit || shukoFixFlag || !row.jizenDat}
          />
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip
            name={row.kizaiNam}
            memo={row.mem2 ?? ''}
            handleMemoChange={handleMemo2Change}
            rowIndex={rowIndex}
            disabled={!edit || shukoFixFlag}
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row === nextProps.row &&
      prevProps.edit === nextProps.edit &&
      prevProps.shukoFixFlag === nextProps.shukoFixFlag &&
      prevProps.jizenMaxDat?.getTime() === nextProps.jizenMaxDat?.getTime()
    );
  }
);

EqTableRow.displayName = 'EqTableRow';

type IdoEqTableProps = {
  rows: IdoJuchuKizaiMeisaiValues[];
  edit: boolean;
  shukoFixFlag: boolean;
  shukoDate: Date | null;
  handleCellDateChange: (kizaiId: number, date: Date | null) => void;
  handleCellDateClear: (kizaiId: number) => void;
};

type IdoEqTableRowProps = {
  row: IdoJuchuKizaiMeisaiValues;
  rowIndex: number;
  edit: boolean;
  shukoFixFlag: boolean;
  shukoDate: Date | null;
  handleCellDateChange: (kizaiId: number, date: Date | null) => void;
  handleCellDateClear: (kizaiId: number) => void;
};

const IdoEqTableRow = React.memo(
  ({ row, rowIndex, edit, shukoFixFlag, shukoDate, handleCellDateChange, handleCellDateClear }: IdoEqTableRowProps) => {
    return (
      <TableRow hover>
        <TableCell
          align="right"
          size="small"
          sx={{
            bgcolor: grey[200],
            py: 0,
            px: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          {rowIndex + 1}
        </TableCell>
        <TableCell style={styles.row} size="small">
          <Box display="flex" width={'200px'}>
            <FormDateX
              sx={{
                width: 160,
                '& .MuiPickersInputBase-root': {
                  height: '23px',
                },
                '& .MuiPickersSectionList-root': {
                  padding: 0,
                },
                '& .MuiButtonBase-root': {
                  padding: 0,
                },
              }}
              value={row.sagyoDenDat}
              onChange={(date) => (date ? handleCellDateChange(row.kizaiId, date) : handleCellDateClear(row.kizaiId))}
              disabled={!edit || shukoFixFlag}
            />
            {row.sagyoSijiId && <Typography>{row.sagyoSijiId === SAGYO_SIJI_ID.ky ? 'K→Y' : 'Y→K'}</Typography>}
          </Box>
        </TableCell>
        <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: grey[200] }}>
          {row.shozokuId === BASHO_ID.kics ? 'K' : 'Y'}
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button
            variant="text"
            sx={{ p: 0, justifyContent: 'start', textTransform: 'none', color: 'text.primary' }}
            onClick={() =>
              openOrFocusTab(`/loan-situation/${row.kizaiId}?date=${shukoDate ? shukoDate.toISOString() : ''}`)
            }
          >
            {row.kizaiNam}
          </Button>
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.kizaiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.planKizaiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.planYobiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: lightBlue[100] }}>
          {row.planQty}
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row === nextProps.row &&
      prevProps.rowIndex === nextProps.rowIndex &&
      prevProps.edit === nextProps.edit &&
      prevProps.shukoFixFlag === nextProps.shukoFixFlag
    );
  }
);

IdoEqTableRow.displayName = 'IdoEqTableRow';

export const IdoEqTable: React.FC<IdoEqTableProps> = React.memo(
  ({ rows, edit, shukoFixFlag, shukoDate, handleCellDateChange, handleCellDateClear }) => {
    const visibleRows = rows.filter((row) => !row.delFlag);
    return (
      <TableContainer style={{ overflow: 'scroll', maxHeight: '80vh' }}>
        <Table stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <TableHead>
            <TableRow>
              <TableCell size="small" style={styles.header} />
              <TableCell align="left" size="small" style={styles.header}>
                移動日
              </TableCell>
              <TableCell align="left" size="small" style={styles.header}>
                YK
              </TableCell>
              <TableCell align="left" size="small" style={styles.header}>
                機材名
              </TableCell>
              <TableCell align="right" size="small" style={styles.header}>
                有効
              </TableCell>
              <TableCell align="right" size="small" style={styles.header}>
                受注
              </TableCell>
              <TableCell align="right" size="small" style={styles.header}>
                予備
              </TableCell>
              <TableCell align="right" size="small" style={styles.header}>
                合計
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleRows.map((row, rowIndex) => (
              <IdoEqTableRow
                key={rowIndex}
                row={row}
                rowIndex={rowIndex}
                edit={edit}
                shukoFixFlag={shukoFixFlag}
                shukoDate={shukoDate}
                handleCellDateChange={handleCellDateChange}
                handleCellDateClear={handleCellDateClear}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.rows === nextProps.rows &&
      prevProps.edit === nextProps.edit &&
      prevProps.shukoFixFlag === nextProps.shukoFixFlag
    );
  }
);

IdoEqTable.displayName = 'IdoEqTable';

/** コンテナの K・Y 列の最小幅（以前の入力欄と同じくらいの幅） */
const CTN_QTY_MIN_WIDTH = 72;

type ContainerTableRowProps = {
  row: JuchuContainerMeisaiValues;
  rowIndex: number;
  shukoDate: Date | null;
};

/**
 * コンテナの行（閲覧のみ）
 * コンテナの追加・削除・予定数・メモの編集は出庫明細（最終確認）で行う
 */
const ContainerTableRow = React.memo(
  ({ row, rowIndex, shukoDate }: ContainerTableRowProps) => {
    return (
      <TableRow hover>
        <TableCell
          align="right"
          size="small"
          sx={{
            bgcolor: grey[200],
            py: 0,
            px: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          {rowIndex + 1}
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button
            variant="text"
            sx={{ p: 0, justifyContent: 'start', textTransform: 'none', color: 'text.primary' }}
            onClick={() =>
              openOrFocusTab(`/loan-situation/${row.kizaiId}?date=${shukoDate ? shukoDate.toISOString() : ''}`)
            }
          >
            {row.kizaiNam}
          </Button>
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ minWidth: CTN_QTY_MIN_WIDTH }}>
          {row.planKicsKizaiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ minWidth: CTN_QTY_MIN_WIDTH }}>
          {row.planYardKizaiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: lightBlue[100] }}>
          {row.planQty}
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip
            name={row.kizaiNam}
            memo={row.mem ? row.mem : ''}
            handleMemoChange={() => {}}
            rowIndex={rowIndex}
            disabled={true}
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row === nextProps.row &&
      prevProps.rowIndex === nextProps.rowIndex &&
      prevProps.shukoDate === nextProps.shukoDate
    );
  }
);

ContainerTableRow.displayName = 'ContainerTableRow';

/**
 * コンテナのテーブル（閲覧のみ）
 * コンテナの追加・削除・予定数・メモの編集は出庫明細（最終確認）で行う
 */
export const ContainerTable = (props: { rows: JuchuContainerMeisaiValues[]; shukoDate: Date | null }) => {
  const { rows, shukoDate } = props;

  const visibleRows = rows.filter((row) => !row.delFlag);

  return (
    <TableContainer
      style={{
        overflow: 'auto',
        maxHeight: '80vh',
      }}
    >
      <Table stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ minWidth: CTN_QTY_MIN_WIDTH }}>
              K
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ minWidth: CTN_QTY_MIN_WIDTH }}>
              Y
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計数
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              連絡
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <ContainerTableRow
              key={`${row.juchuKizaiMeisaiId}-${row.kizaiId}`}
              row={row}
              rowIndex={rowIndex}
              shukoDate={shukoDate}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // ヘッダー
  header: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    whiteSpace: 'nowrap',
    height: '25px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  // 行
  row: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    whiteSpace: 'nowrap',
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
};
