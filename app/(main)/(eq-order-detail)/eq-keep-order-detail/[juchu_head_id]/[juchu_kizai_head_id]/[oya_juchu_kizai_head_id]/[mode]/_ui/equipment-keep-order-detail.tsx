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
  ClickAwayListener,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringMonthDay } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, TestDate } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import Time, { TestTime } from '@/app/(main)/_ui/time';
import { OyaJuchuKizaiHeadValues } from '@/app/(main)/(eq-order-detail)/_lib/types';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import {
  JuchuKizaiHeadValues,
  JuchuKizaiMeisaiValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';
import { AddLock, DeleteLock, GetLock } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { LockValues, OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';

import { data, stock } from '../_lib/data';
import { KeepJuchuKizaiMeisaiValues } from '../_lib/types';
import { KeepEqTable, KeepStockTable } from './equipment-keep-order-detail-table';

export type KeepEquipmentData = {
  date: string;
  memo: string;
};

export type StockData = {
  id: number;
  data: number[];
};

export type KeepEquipment = {
  id: number;
  name: string;
  memo: string;
  place: string;
  issue: number;
  keep: number;
};

// 開始日から終了日までの日付配列の作成
const getRange = (start: Date | null, end: Date | null): string[] => {
  if (start !== null && end !== null) {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringMonthDay(current);
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
      const dateStr = toISOStringMonthDay(current);
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

// ストックテーブルの行作成
const getStockRow = (stock: number[], length: number) => {
  const rows: StockData[] = [];

  stock.map((num, index) => {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      if (i === 0 || i === 1 || i === 2) {
        data.push(num - 1);
      } else {
        data.push(num);
      }
    }
    const row: StockData = { id: index + 1, data: data };
    rows.push(row);
  });

  return rows;
};

// 200件用データ作成
export const testeqData: KeepEquipment[] = Array.from({ length: 50 }, (_, i) => {
  const original = data[i % data.length];
  return {
    ...original,
    id: i + 1,
    name: `${original.name} (${i + 1})`,
    memo: original.memo,
    place: original.place,
    all: original.issue,
    order: original.keep,
  };
});
// 200件用データ作成
export const testStock = Array.from({ length: 50 }, (_, i) => stock[i % stock.length]);

export const EquipmentKeepOrderDetail = (props: {
  juchuHeadData: OrderValues;
  oyaJuchuKizaiHeadData: OyaJuchuKizaiHeadValues;
  edit: boolean;
}) => {
  // user情報
  const user = useUserStore((state) => state.user);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 全体の保存フラグ
  const [save, setSave] = useState(false);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // 受注機材明細リスト
  const [oyaJuchuKizaiMeisaiList, setOyaJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>([]);

  // KICS出庫日
  const [startKICSDate, setStartKICSDate] = useState<Date | null>(null);
  // YARD出庫日
  const [startYARDDate, setStartYARDDate] = useState<Date | null>(null);
  // KICS入庫日
  const [endKICSDate, setEndKICSDate] = useState<Date | null>(null);
  // YARD入庫日
  const [endYARDDate, setEndYARDDate] = useState<Date | null>(new Date('2025/11/9 15:00'));
  // 出庫日
  const [startDate, setStartDate] = useState<Date | null>(null);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(getRange(new Date('2025/11/2'), new Date('2025/11/19')));
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date('2025/11/2'));

  // ヘッダー用の日付
  const [dateHeader, setDateHeader] = useState<string[]>(getStockHeader(new Date('2025/11/2')));
  // ストックテーブルの行配列
  const [stockRows, setStockRows] = useState<StockData[]>(getStockRow(testStock, dateHeader.length));
  // 機材テーブルの行配列
  const [equipmentRows, setEquipmentRows] = useState<KeepEquipment[]>(testeqData);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // context
  const { setIsDirty, setIsSave, setLock } = useDirty();

  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  // useUnsavedChangesWarning(isDirty, save);

  useEffect(() => {
    if (!user) return;

    const asyncProcess = async () => {
      setIsLoading(true);
      const lockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (props.edit && lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
        setLockData(newLockData);
      } else if (props.edit && lockData !== null && lockData.addUser !== user.name) {
        setEdit(false);
      }
      setIsLoading(false);
    };
    asyncProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
    // 編集→閲覧
    if (edit) {
      await DeleteLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      // 閲覧→編集
    } else {
      if (!user) return;
      const lockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
        setLockData(newLockData);
        setEdit(true);
      } else if (lockData !== null && lockData.addUser === user.name) {
        setEdit(true);
      }
    }
  };

  /**
   * 機材キープメモ入力時
   * @param rowIndex 入力された行番号
   * @param memo キープメモ内容
   */
  const handleMemoChange = (rowIndex: number, memo: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].memo = memo;
    setEquipmentRows(updatedRows);
  };

  /**
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date.toDate());
      const updatedHeader = getStockHeader(date?.toDate());
      const updatedRow = getStockRow(testStock, updatedHeader.length);
      setDateHeader(updatedHeader);
      setStockRows(updatedRow);

      setAnchorEl(null);
    }
  };

  // 3か月前
  const handleBackDateChange = () => {
    const date = subMonths(new Date(dateHeader[1]), 3);
    handleDateChange(dayjs(date));
  };
  // 3か月後
  const handleForwardDateChange = () => {
    const date = addMonths(new Date(dateHeader[1]), 3);
    handleDateChange(dayjs(date));
  };

  /**
   * KICS出庫日時変更時
   * @param newDate KICS出庫日
   */
  const handleKICSStartChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setStartKICSDate(newDate?.toDate());

    if (startYARDDate === null || newDate.toDate() < startYARDDate) {
      setStartDate(newDate.toDate());
    }
  };

  /**
   * YARD出庫日時変更時
   * @param newDate YARD出庫日
   */
  const handleYARDStartChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setStartYARDDate(newDate?.toDate());

    if (startKICSDate === null || newDate.toDate() < startKICSDate) {
      setStartDate(newDate.toDate());
    }
  };

  /**
   * ポッパー開閉
   * @param event マウスイベント
   */
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };
  const handleClickAway = () => {
    setAnchorEl(null);
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };
  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = () => {
    setEqSelectionDialogOpen(true);
  };

  /**
   * 機材テーブルのキープ数入力時
   * @param kizaiId 機材id
   * @param keepValue キープ数
   */
  const handleCellChange = (kizaiId: number, keepValue: number) => {
    setOyaJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, plankeepQty: keepValue } : data))
    );
  };

  const setEqpts = async (data: JuchuKizaiMeisaiValues[]) => {
    const ids = new Set(oyaJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterData = data.filter((d) => !ids.has(d.kizaiId));
    const newOyaJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = filterData.map((d) => ({
      juchuHeadId: d.juchuHeadId,
      juchuKizaiHeadId: 0,
      juchuKizaiMeisaiId: 0,
      shozokuId: d.shozokuId,
      shozokuNam: d.shozokuNam,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiTankaAmt: d.kizaiTankaAmt,
      kizaiNam: d.kizaiNam,
      oyaPlanKizaiQty: d.planKizaiQty,
      oyaPlanYobiQty: d.planYobiQty ?? 0,
      plankeepQty: 0,
      delFlag: false,
      saveFlag: false,
    }));
    setOyaJuchuKizaiMeisaiList((prev) => [...prev, ...newOyaJuchuKizaiMeisaiData]);
  };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <Grid2 container spacing={4}>
          {lockData !== null && lockData.addUser !== user?.name && (
            <Grid2 container alignItems={'center'} spacing={2}>
              <Typography>{lockData.addDat && toISOString(new Date(lockData.addDat))}</Typography>
              <Typography>{lockData.addUser}</Typography>
              <Typography>編集中</Typography>
            </Grid2>
          )}
          <Grid2 container alignItems={'center'} spacing={1}>
            {!edit || (lockData !== null && lockData?.addUser !== user?.name) ? (
              <Typography>閲覧モード</Typography>
            ) : (
              <Typography>編集モード</Typography>
            )}
            <Button disabled={lockData && lockData?.addUser !== user?.name ? true : false} onClick={handleEdit}>
              変更
            </Button>
          </Grid2>
          <BackButton label={'戻る'} />
        </Grid2>
      </Box>
      {/*受注ヘッダー*/}
      <Accordion expanded={expanded} onChange={handleExpansion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Box display="flex" justifyContent="space-between" alignItems="center" py={1} width="100%">
            <Grid2 container display="flex" justifyContent="space-between" spacing={2}>
              <Typography>受注ヘッダー</Typography>
              <Grid2 container display={expanded ? 'none' : 'flex'} spacing={2}>
                <Typography>公演名</Typography>
                <Typography>{props.juchuHeadData.koenNam}</Typography>
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
                    <TextField defaultValue={props.juchuHeadData.juchuHeadId} disabled></TextField>
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography mr={2}>受注ステータス</Typography>
                    <Select value={props.juchuHeadData.juchuSts} disabled>
                      <MenuItem value={0}>入力中</MenuItem>
                      <MenuItem value={1}>仮受注</MenuItem>
                      <MenuItem value={2}>処理中</MenuItem>
                      <MenuItem value={3}>確定</MenuItem>
                      <MenuItem value={4}>貸出済み</MenuItem>
                      <MenuItem value={5}>返却済み</MenuItem>
                      <MenuItem value={9}>受注キャンセル</MenuItem>
                    </Select>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注日
                </Typography>
                <TestDate date={props.juchuHeadData.juchuDat} onChange={() => {}} disabled />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  入力者
                </Typography>
                <TextField defaultValue={props.juchuHeadData.nyuryokuUser} disabled></TextField>
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  公演名
                </Typography>
                <TextField defaultValue={props.juchuHeadData.koenNam} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3} whiteSpace="nowrap">
                  公演場所
                </Typography>
                <TextField defaultValue={props.juchuHeadData.koenbashoNam} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  相手
                </Typography>
                <TextField defaultValue={props.juchuHeadData.kokyaku.kokyakuNam} disabled></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細ヘッダー(キープ)*/}
      <Accordion sx={{ mt: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div" sx={{ bgcolor: 'green', color: 'white' }}>
          <Grid2
            container
            display="flex"
            alignItems={'center'}
            justifyContent="space-between"
            spacing={2}
            py={1}
            width={'100%'}
          >
            <Typography>受注機材ヘッダー(キープ)</Typography>
            <Button>
              <CheckIcon fontSize="small" />
              保存
            </Button>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container alignItems="center" spacing={2} p={2}>
            <Grid2 container alignItems="center">
              <Typography>機材明細名</Typography>
              <TextField value={'キープ分（YARD/HT）'} />
            </Grid2>
          </Grid2>
          <Grid2 container p={2} spacing={2}>
            <Grid2 order={{ xl: 1 }} width={380}>
              <Typography>親伝票出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate date={new Date(props.oyaJuchuKizaiHeadData.kicsShukoDat)} onChange={() => {}} disabled />
                <TestTime time={new Date(props.oyaJuchuKizaiHeadData.kicsShukoDat)} onChange={() => {}} disabled />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate date={new Date(props.oyaJuchuKizaiHeadData.yardShukoDat)} onChange={() => {}} disabled />
                <TestTime time={new Date(props.oyaJuchuKizaiHeadData.yardShukoDat)} onChange={() => {}} disabled />
              </Grid2>
            </Grid2>
            <Grid2 width={380} order={{ xl: 4 }}>
              <Typography>親伝票入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate date={new Date(props.oyaJuchuKizaiHeadData.kicsNyukoDat)} onChange={() => {}} disabled />
                <TestTime time={new Date(props.oyaJuchuKizaiHeadData.kicsNyukoDat)} onChange={() => {}} disabled />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate date={new Date(props.oyaJuchuKizaiHeadData.yardNyukoDat)} onChange={() => {}} disabled />
                <TestTime time={new Date(props.oyaJuchuKizaiHeadData.yardNyukoDat)} onChange={() => {}} disabled />
              </Grid2>
            </Grid2>
            <Grid2 width={380} order={{ xl: 2 }}>
              <Typography>キープ出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate
                  date={startKICSDate}
                  minDate={endYARDDate !== null ? endYARDDate : undefined}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleKICSStartChange}
                />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate
                  date={startYARDDate}
                  minDate={endYARDDate !== null ? endYARDDate : undefined}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleYARDStartChange}
                />
                <Time />
              </Grid2>
            </Grid2>
            <Grid2 width={380} order={{ xl: 3 }}>
              <Typography>キープ入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate
                  date={startKICSDate}
                  minDate={endYARDDate !== null ? endYARDDate : undefined}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleKICSStartChange}
                />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <TestDate
                  date={startYARDDate}
                  minDate={endYARDDate !== null ? endYARDDate : undefined}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleYARDStartChange}
                />
                <Time />
              </Grid2>
            </Grid2>
          </Grid2>
          <Grid2 container alignItems="center" p={2} spacing={2}>
            <Grid2 container alignItems="center">
              <Typography>メモ</Typography>
              <TextField multiline rows={3} />
              {/* <TextFieldElement name="mem" control={control} multiline rows={3} disabled={!edit}></TextFieldElement> */}
            </Grid2>
            <Grid2 container alignItems="center">
              <Typography>入出庫ステータス</Typography>
              <TextField disabled defaultValue={'準備中'}></TextField>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" alignItems="center" py={1} px={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
        </Box>
        <Divider />

        <Dialog open={EqSelectionDialogOpen} maxWidth="sm" fullWidth>
          <OyaEqSelectionDialog
            juchuHeadId={props.juchuHeadData.juchuHeadId}
            oyaJuchuKizaiHeadId={props.oyaJuchuKizaiHeadData.juchuKizaiHeadId}
            setEqpts={setEqpts}
            onClose={setEqSelectionDialogOpen}
          />
        </Dialog>

        <Box width="100%">
          <Box my={1} mx={2}>
            <Button disabled={!edit} onClick={() => handleOpenEqDialog()}>
              <AddIcon fontSize="small" />
              機材追加
            </Button>
          </Box>
          <Box width={'min-content'} display={Object.keys(oyaJuchuKizaiMeisaiList).length > 0 ? 'block' : 'none'}>
            <KeepEqTable
              rows={oyaJuchuKizaiMeisaiList}
              handleMemoChange={handleMemoChange}
              onChange={handleCellChange}
            />
          </Box>
        </Box>
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
