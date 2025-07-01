'use client';

import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { TestDate, toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';
import Time, { TestTime } from '@/app/(main)/_ui/time';

import { EquipmentSelectionDialog } from '../../equipment-order-detail/_ui/equipment-selection-dailog';
import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { data, stock } from '../_lib/data';
import { ReturnEqTable, ReturnStockTable } from './equipment-return-order-detail-table';

export type ReturnEquipmentData = {
  date: string;
  memo: string;
};

export type StockData = {
  id: number;
  data: number[];
};

export type ReturnEquipment = {
  id: number;
  name: string;
  memo: string;
  place: string;
  issue: number;
  return: number;
};

// 開始日から終了日までの日付配列の作成
const getRange = (start: Date, end: Date): string[] => {
  if (start !== null && end !== null) {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

// ストックテーブルの日付ヘッダーの作成
const getStockHeader = (date: Date | null) => {
  if (date !== null) {
    const start = subDays(date, 1);
    const end = endOfMonth(addMonths(date, 2));
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

// ストックテーブルの行作成
const getStockRow = (
  eq: ReturnEquipment[],
  dateHeader: string[],
  dateRange: string[],
  stock: number[],
  length: number
) => {
  const rows: StockData[] = [];

  stock.map((num, index) => {
    const data: number[] = [];
    const targetIndex = dateHeader
      .map((date, index) => (dateRange.includes(date) ? index : -1))
      .filter((index) => index !== -1);

    for (let i = 0; i < length; i++) {
      if (targetIndex.includes(i)) {
        data.push(num - eq[index].issue);
      } else {
        data.push(num);
      }
    }
    const row: StockData = { id: index + 1, data: data };
    rows.push(row);
  });

  return rows;
};

export const EquipmentReturnOrderDetail = () => {
  // KICS出庫日
  const [startKICSDate, setStartKICSDate] = useState<Date | null>(null);
  // YARD出庫日
  const [startYARDDate, setStartYARDDate] = useState<Date | null>(new Date('2025/11/2 10:00'));
  // KICS入庫日
  const [endKICSDate, setEndKICSDate] = useState<Date | null>(null);
  // YARD入庫日
  const [endYARDDate, setEndYARDDate] = useState<Date | null>(null);
  // 出庫日
  const [startDate, setStartDate] = useState<Date | null>(null);
  // 入庫日
  const [endDate, setEndDate] = useState<Date | null>(null);
  // KICS再度出庫日
  const [againKICSDate, setAgainKICSDate] = useState<Date | null>(null);
  // YARD再度出庫日
  const [againYARDDate, setAgainYARDDate] = useState<Date | null>(null);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>([]);

  // ヘッダー用の日付
  const [dateHeader, setDateHeader] = useState<string[]>(getStockHeader(new Date('2025/11/2')));
  // ヘッダー用出庫日から入庫日
  const [dateHeaderRange, setDateHeaderRange] = useState<string[]>(
    getRange(new Date('2025/11/2'), new Date('2025/11/19'))
  );

  // 機材テーブルの行配列
  const [equipmentRows, setEquipmentRows] = useState<ReturnEquipment[]>(data);
  // ストックテーブルの行配列
  const [stockRows, setStockRows] = useState<StockData[]>(
    getStockRow(equipmentRows, dateHeader, dateHeaderRange, stock, dateHeader.length)
  );

  // 内税、外税
  const [selectTax, setSelectTax] = useState('外税');

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);

  /**
   * KICS再度出庫日時変更時
   * @param newDate 入庫日
   */
  const handleKICSAgainChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setAgainKICSDate(newDate?.toDate());

    if (againYARDDate === null || newDate.toDate() > againYARDDate) {
      const updatedDateRange = endDate !== null ? getRange(endDate, subDays(newDate?.toDate(), 1)) : [];
      setDateRange(updatedDateRange);

      const updatedRow = getStockRow(
        equipmentRows,
        dateHeaderRef.current,
        dateHeaderRange,
        stock,
        dateHeaderRef.current.length
      );

      const targetIndex = dateHeaderRef.current
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] += equipmentRows[i].return;
        });
      });
      setStockRows(updatedRow);
      setStartDate(newDate.toDate());
    }
  };

  /**
   * YARD再度出庫日時変更時
   * @param newDate 入庫日
   */
  const handleYARDAgainChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setAgainYARDDate(newDate?.toDate());

    if (againKICSDate === null || newDate.toDate() > againKICSDate) {
      const updatedDateRange = endDate !== null ? getRange(endDate, subDays(newDate?.toDate(), 1)) : [];
      setDateRange(updatedDateRange);

      const updatedRow = getStockRow(
        equipmentRows,
        dateHeaderRef.current,
        dateHeaderRange,
        stock,
        dateHeaderRef.current.length
      );

      const targetIndex = dateHeaderRef.current
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] += equipmentRows[i].return;
        });
      });
      setStockRows(updatedRow);
      setStartDate(newDate.toDate());
    }
  };

  /**
   * KICS入庫日時変更時
   * @param newDate KICS入庫日
   */
  const handleKICSEndChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setEndKICSDate(newDate?.toDate());

    if (endYARDDate === null || newDate.toDate() > endYARDDate) {
      const updatedDateRange = getRange(
        newDate?.toDate(),
        startDate !== null ? subDays(startDate, 1) : new Date('2025/11/19')
      );
      const updatedRow = getStockRow(
        equipmentRows,
        dateHeaderRef.current,
        dateHeaderRange,
        stock,
        dateHeaderRef.current.length
      );
      setDateRange(updatedDateRange);
      const targetIndex = dateHeaderRef.current
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] += equipmentRows[i].return;
        });
      });
      setStockRows(updatedRow);
      setEndDate(newDate.toDate());
    }
  };

  /**
   * YARD入庫日時変更時
   * @param newDate YARD入庫日
   */
  const handleYARDEndChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setEndYARDDate(newDate?.toDate());

    if (endKICSDate === null || newDate.toDate() > endKICSDate) {
      const updatedDateRange = getRange(
        newDate?.toDate(),
        startDate !== null ? subDays(startDate, 1) : new Date('2025/11/19')
      );
      const updatedRow = getStockRow(
        equipmentRows,
        dateHeaderRef.current,
        dateHeaderRange,
        stock,
        dateHeaderRef.current.length
      );
      setDateRange(updatedDateRange);
      const targetIndex = dateHeaderRef.current
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] += equipmentRows[i].return;
        });
      });
      setStockRows(updatedRow);
      setEndDate(newDate.toDate());
    }
  };

  /**
   * 機材メモ入力時
   * @param rowIndex 入力された行番号
   * @param memo メモ内容
   */
  const handleMemoChange = (rowIndex: number, memo: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].memo = memo;
    setEquipmentRows(updatedRows);
  };

  /**
   * 機材テーブルの返却数入力時
   * @param rowIndex 入力された行番号
   * @param orderValue 返却数
   */
  const handleCellChange = (rowIndex: number, returnValue: number) => {
    setEquipmentRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, return: returnValue } : row)));

    const targetIndex = dateHeaderRef.current
      .map((date, index) => (dateRangeRef.current.includes(date) ? index : -1))
      .filter((index) => index !== -1);

    if (targetIndex.length === 0) return;

    const updatedRow = getStockRow(
      equipmentRows,
      dateHeaderRef.current,
      dateHeaderRange,
      stock,
      dateHeaderRef.current.length
    );
    const updatedData = updatedRow[rowIndex].data;
    targetIndex.map((index) => {
      updatedData[index] += returnValue;
    });
    setStockRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, data: updatedData } : row)));
  };

  // 内税、外税変更
  const selectTaxChange = (event: SelectChangeEvent) => {
    setSelectTax(event.target.value);
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };
  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = () => {
    setEqSelectionDialogOpen(true);
  };
  const handleCloseEqDialog = () => {
    setEqSelectionDialogOpen(false);
  };

  // ref
  const dateRangeRef = useRef(dateRange);
  const dateHeaderRef = useRef(dateHeader);

  useEffect(() => {
    console.log('dateRange変更');
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  useEffect(() => {
    console.log('dateHeader変更');
    dateHeaderRef.current = dateHeader;
  }, [dateHeader]);

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <BackButton label={'戻る'} />
      </Box>
      {/*受注ヘッダー*/}
      <Accordion expanded={expanded} onChange={handleExpansion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Box display="flex" justifyContent="space-between" alignItems="center" py={1} width="100%">
            <Grid2 container display="flex" justifyContent="space-between" spacing={2}>
              <Typography>受注ヘッダー</Typography>
              <Grid2 container display={expanded ? 'none' : 'flex'} spacing={2}>
                <Typography>公演名</Typography>
                <Typography>A/Zepp Tour</Typography>
              </Grid2>
            </Grid2>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container display="flex">
            <Grid2>
              <Grid2 container margin={2} spacing={2}>
                <Grid2 container display="flex" direction="row" alignItems="center">
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={3} whiteSpace="nowrap">
                      受注番号
                    </Typography>
                    <TextField defaultValue="81694" disabled></TextField>
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography mr={2}>受注ステータス</Typography>
                    <TextField defaultValue="確定" disabled sx={{ width: 120 }}>
                      確定
                    </TextField>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注日
                </Typography>
                <TextField defaultValue="2025/10/01" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  入力者
                </Typography>
                <TextField defaultValue="XXXXXXXX" disabled></TextField>
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  公演名
                </Typography>
                <TextField defaultValue="A/Zepp Tour" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3} whiteSpace="nowrap">
                  公演場所
                </Typography>
                <TextField defaultValue="Zepp Osaka" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  相手
                </Typography>
                <TextField defaultValue="(株)シアターブレーン" disabled></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細ヘッダー(返却)*/}
      <Accordion sx={{ mt: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div" sx={{ bgcolor: 'red', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" py={1} width={'100%'}>
            <Typography>受注機材ヘッダー(返却)</Typography>
            <Button>
              <CheckIcon fontSize="small" />
              保存
            </Button>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container alignItems="center" spacing={2} p={2}>
            <Grid2 container alignItems="center">
              <Typography>機材明細名</Typography>
              <TextField
                value={'キープ一部返却'}
                sx={{
                  '& .MuiInputBase-input': {
                    color: 'red',
                  },
                }}
              />
            </Grid2>
            <Grid2 container alignItems="center">
              <Typography>小計金額</Typography>
              <TextField
                value={'-¥400000'}
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                    color: 'red',
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
              />
            </Grid2>
            <Grid2 container alignItems="center">
              <Typography>税区分</Typography>
              <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                <Select value={selectTax} onChange={selectTaxChange}>
                  <MenuItem value={'外税'}>外税</MenuItem>
                  <MenuItem value={'内税'}>内税</MenuItem>
                </Select>
              </FormControl>
            </Grid2>
          </Grid2>
          <Grid2 container p={2} spacing={2}>
            <Grid2>
              <Typography>元伝票</Typography>
              <Grid2 container spacing={2}>
                <Grid2 width={500}>
                  <Typography>出庫日時</Typography>
                  <Grid2>
                    <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                    <TestDate disabled date={startKICSDate} onChange={(newDate) => console.log()} />
                    <Time disabled />
                  </Grid2>
                  <Grid2>
                    <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                    <TestDate
                      disabled
                      date={startYARDDate}
                      onChange={(newDate) => {
                        if (newDate !== null) {
                          setStartYARDDate(newDate?.toDate());
                        }
                      }}
                    />
                    <TestTime
                      disabled
                      time={startYARDDate && startYARDDate}
                      onChange={(newDate) => newDate && setStartYARDDate(newDate.toDate())}
                    />
                  </Grid2>
                </Grid2>
                <Grid2 width={500}>
                  <Typography>入庫日時</Typography>
                  <Grid2>
                    <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                    <TestDate
                      date={endKICSDate}
                      minDate={new Date('2025/11/2')}
                      maxDate={startDate !== null ? startDate : new Date('2025/11/19')}
                      onChange={handleKICSEndChange}
                    />
                    <Time />
                  </Grid2>
                  <Grid2>
                    <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                    <TestDate
                      date={endYARDDate}
                      minDate={new Date('2025/11/2')}
                      maxDate={startDate !== null ? startDate : new Date('2025/11/19')}
                      onChange={handleYARDEndChange}
                    />
                    <Time />
                  </Grid2>
                </Grid2>
              </Grid2>
            </Grid2>
            <Grid2 width={500}>
              <Box display={'flex'} alignItems={'center'}>
                <Checkbox sx={{ p: 0 }} />
                <Typography>再出庫指示（出庫伝票自動作成）</Typography>
              </Box>
              <Typography>再出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={againKICSDate}
                  minDate={endDate !== null ? endDate : new Date('2025/11/2')}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleKICSAgainChange}
                />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={againYARDDate}
                  minDate={endDate !== null ? endDate : new Date('2025/11/2')}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleYARDAgainChange}
                />
                <Time />
              </Grid2>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" py={1} px={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
          <Button>
            <CheckIcon fontSize="small" />
            保存
          </Button>
        </Box>
        <Divider />
        <Dialog open={EqSelectionDialogOpen} fullScreen>
          <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
        </Dialog>
        <Button sx={{ m: 2 }} onClick={() => handleOpenEqDialog()}>
          <AddIcon fontSize="small" />
          機材追加
        </Button>
        <Box display="flex" flexDirection="row" width="100%">
          <Box
            sx={{
              width: {
                xs: '40%',
                sm: '40%',
                md: '40%',
                lg: 'min-content',
              },
            }}
          >
            <ReturnEqTable rows={equipmentRows} onChange={handleCellChange} handleMemoChange={handleMemoChange} />
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <ReturnStockTable
              header={dateHeader}
              rows={stockRows}
              dateRange={dateHeaderRange}
              startDate={startDate}
              endDate={endDate}
              getHeaderBackgroundColor={getDateHeaderBackgroundColor}
              getRowBackgroundColor={getDateRowBackgroundColor}
            />
          </Box>
        </Box>
      </Paper>
      {/*本番日*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box>
          <Box display="flex" alignItems="center" p={2}>
            <Typography>本番日数</Typography>
            <TextField
              type="number"
              sx={{
                width: '5%',
                minWidth: '60px',
                ml: 2,
                '& .MuiInputBase-input': {
                  textAlign: 'right',
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
            />
            日
          </Box>
        </Box>
        <Grid2 container alignItems="center" spacing={2} p={2}>
          <Typography>入出庫ステータス</Typography>
          <TextField disabled defaultValue={'準備中'}></TextField>
        </Grid2>
      </Paper>
    </Box>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 2,
    marginLeft: 2,
  },
  // ボタン
  button: {},
};
