'use client';

import { Box, Button, Container, Divider, Grid2, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';

import { RSuiteDateRangePicker, toISOStringWithTimezone } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import { toISOStringYearMonthDay } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';
import {
  AddHonbanbi,
  ConfirmHonbanbi,
  DeleteHonbanbi,
  UpdateHonbanbi,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { JuchuKizaiHonbanbiValues } from '../_lib/types';

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

type DateDialogProps = {
  userNam: string;
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  shukoDate: Date | null;
  nyukoDate: Date | null;
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
  juchuHonbanbiDeleteList: JuchuKizaiHonbanbiValues[];
  onClose: () => void;
  onSave: (juchuHonbanbiList: JuchuKizaiHonbanbiValues[], juchuHonbanbiDeleteList: JuchuKizaiHonbanbiValues[]) => void;
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const DateSelectDialog = ({
  userNam,
  juchuHeadId,
  juchuKizaiHeadId,
  shukoDate,
  nyukoDate,
  juchuHonbanbiList,
  juchuHonbanbiDeleteList,
  onClose,
  onSave,
}: DateDialogProps) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  const [value, setValue] = useState(10);
  // 仕込
  const [sikomi, setSikomi] = useState<JuchuKizaiHonbanbiValues[]>(
    juchuHonbanbiList.filter((d) => d.juchuHonbanbiShubetuId === 10)
  );
  // RH
  const [rh, setRh] = useState<JuchuKizaiHonbanbiValues[]>(
    juchuHonbanbiList.filter((d) => d.juchuHonbanbiShubetuId === 20)
  );
  // GP
  const [gp, setGp] = useState<JuchuKizaiHonbanbiValues[]>(
    juchuHonbanbiList.filter((d) => d.juchuHonbanbiShubetuId === 30)
  );
  // 本番
  const [honban, setHonban] = useState<JuchuKizaiHonbanbiValues[]>(
    juchuHonbanbiList.filter((d) => d.juchuHonbanbiShubetuId === 40)
  );
  // 削除予定リスト
  const [deleteList, setDeleteList] = useState<JuchuKizaiHonbanbiValues[]>(juchuHonbanbiDeleteList);
  // 選択日付
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(
    shukoDate && nyukoDate ? [shukoDate, nyukoDate] : null
  );

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleSikomiMemChange = (index: number, value: string) => {
    setSikomi((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  const handleSikomiRemove = (index: number) => {
    setDeleteList((prev) => [...prev, sikomi[index]]);
    const updatedSikomi = sikomi.filter((_, i) => i !== index);
    setSikomi(updatedSikomi);
  };

  const handleRhMemChange = (index: number, value: string) => {
    setRh((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  const handleRhRemove = (index: number) => {
    setDeleteList((prev) => [...prev, rh[index]]);
    const updatedRh = rh.filter((_, i) => i !== index);
    setRh(updatedRh);
  };

  const handleGpMemChange = (index: number, value: string) => {
    setGp((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  const handleGpRemove = (index: number) => {
    setDeleteList((prev) => [...prev, gp[index]]);
    const updatedGp = gp.filter((_, i) => i !== index);
    setGp(updatedGp);
  };

  const handleHonbanAddChange = (index: number, value: number) => {
    setHonban((prev) => prev.map((d, i) => (i === index ? { ...d, juchuHonbanbiAddQty: value } : d)));
  };
  const handleHonbanMemChange = (index: number, value: string) => {
    setHonban((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  const handleHonbanRemove = (index: number) => {
    setDeleteList((prev) => [...prev, honban[index]]);
    const updatedHonban = honban.filter((_, i) => i !== index);
    setHonban(updatedHonban);
  };

  const handleSave = async () => {
    //setIsLoading(true);
    const juchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [...sikomi, ...rh, ...gp, ...honban];
    // console.log('-------------削除データ', deleteList, '--------------');

    // if (deleteList.length > 0) {
    //   console.log('--------------削除データあり-------------');
    //   for (const item of deleteList) {
    //     const result = await DeleteHonbanbi(juchuHeadId, juchuKizaiHeadId, item);
    //     console.log('----------------', result, '-------------');
    //   }
    // }
    // setDeleteList([]);

    // for (const item of juchuHonbanbiData) {
    //   const confirm = await ConfirmHonbanbi(juchuHeadId, juchuKizaiHeadId, item);
    //   if (confirm) {
    //     const result = await UpdateHonbanbi(juchuHeadId, juchuKizaiHeadId, item, userNam);
    //   } else {
    //     const result = await AddHonbanbi(juchuHeadId, juchuKizaiHeadId, item, userNam);
    //   }
    // }
    onSave(juchuHonbanbiData, deleteList);
    //setIsLoading(false);
  };

  const handleClose = () => {
    setDeleteList([]);
    onClose();
  };

  const handleAddInput = (value: number) => {
    if (dateRange !== null) {
      // カレンダーで選択された日付
      const newDates = getDateRange(dateRange[0], dateRange[1]);

      switch (value) {
        case 10:
          const updatedSikomi: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 10,
            juchuHonbanbiDat: new Date(d),
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setSikomi((prev) => {
            const existDate = new Set(prev.map((d) => toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            const unique = updatedSikomi.filter((d) => !existDate.has(toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
        case 20:
          const updatedRh: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 20,
            juchuHonbanbiDat: new Date(d),
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setRh((prev) => {
            const existDate = new Set(prev.map((d) => toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            const unique = updatedRh.filter((d) => !existDate.has(toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
        case 30:
          const updatedGp: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 30,
            juchuHonbanbiDat: new Date(d),
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setGp((prev) => {
            const existDate = new Set(prev.map((d) => toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            const unique = updatedGp.filter((d) => !existDate.has(toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
        case 40:
          const updatedHonban: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 40,
            juchuHonbanbiDat: new Date(d),
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setHonban((prev) => {
            const existDate = new Set(prev.map((d) => toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            const unique = updatedHonban.filter((d) => !existDate.has(toISOStringYearMonthDay(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
      }
    }
  };

  const handleDateChange = (range: [Date, Date] | null) => {
    setDateRange(range);
  };

  const getDateRange = (start: Date, end: Date): string[] => {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringYearMonthDay(current);
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  };

  if (isLoading)
    return (
      <Box height={'100vh'}>
        <Loading />
      </Box>
    );

  return (
    <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Typography margin={1}>日付選択</Typography>
          <Grid2 container spacing={1}>
            <Button
              onClick={() => {
                handleSave();
              }}
            >
              保存
            </Button>
            <Button onClick={handleClose}>戻る</Button>
          </Grid2>
        </Box>
      </Paper>
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Grid2 container spacing={2} pt={2}>
          <Tabs value={value} onChange={handleChange}>
            <Tab value={10} label="仕込" sx={{ bgcolor: 'mediumpurple' }} />
            <Tab value={20} label="RH" sx={{ bgcolor: 'orange' }} />
            <Tab value={30} label="GP" sx={{ bgcolor: 'lightgreen' }} />
            <Tab value={40} label="本番" sx={{ bgcolor: 'pink' }} />
          </Tabs>
          <Box ml={20}>
            <RSuiteDateRangePicker
              value={dateRange}
              minDate={shukoDate}
              maxDate={nyukoDate}
              onChange={handleDateChange}
            />
            <Button sx={{ ml: 2 }} onClick={() => handleAddInput(value)}>
              追加
            </Button>
          </Box>
        </Grid2>
        <Divider />
        <TabPanel value={value} index={10}>
          {sikomi.map((data, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={toISOStringYearMonthDay(data.juchuHonbanbiDat)} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={data.mem ? data.mem : ''}
                onChange={(e) => handleSikomiMemChange(index, e.target.value)}
              ></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleSikomiRemove(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index={20}>
          {rh.map((data, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={toISOStringYearMonthDay(data.juchuHonbanbiDat)} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={data.mem ? data.mem : ''}
                onChange={(e) => handleRhMemChange(index, e.target.value)}
              ></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleRhRemove(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index={30}>
          {gp.map((data, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={toISOStringYearMonthDay(data.juchuHonbanbiDat)} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={data.mem ? data.mem : ''}
                onChange={(e) => handleGpMemChange(index, e.target.value)}
              ></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleGpRemove(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index={40}>
          {honban.map((data, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={toISOStringYearMonthDay(data.juchuHonbanbiDat)} />
              <TextField
                value={data.juchuHonbanbiAddQty}
                onChange={(e) => handleHonbanAddChange(index, Number(e.target.value))}
                type="number"
                sx={{
                  width: '50px',
                  ml: 2,
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
              />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={data.mem ? data.mem : ''}
                onChange={(e) => handleHonbanMemChange(index, e.target.value)}
              ></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleHonbanRemove(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
      </Paper>
    </Container>
  );
};
