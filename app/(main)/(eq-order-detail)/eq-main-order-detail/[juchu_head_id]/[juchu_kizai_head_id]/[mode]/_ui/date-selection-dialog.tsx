'use client';

import { Box, Button, Container, Divider, Grid2, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';

import { toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { RSuiteDateRangePicker } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import { getRange } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';

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
  juchuHeadId,
  juchuKizaiHeadId,
  shukoDate,
  nyukoDate,
  juchuHonbanbiList,
  juchuHonbanbiDeleteList,
  onClose,
  onSave,
}: DateDialogProps) => {
  // タブ
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

  /**
   * タブ切り替え
   * @param event イベント
   * @param newValue 指定タブ
   */
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  /**
   * 仕込メモ更新
   * @param index index
   * @param value 仕込メモ内容
   */
  const handleSikomiMemChange = (index: number, value: string) => {
    setSikomi((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  /**
   * 仕込指定日削除
   * @param index index
   */
  const handleSikomiRemove = (index: number) => {
    setDeleteList((prev) => [...prev, sikomi[index]]);
    const updatedSikomi = sikomi.filter((_, i) => i !== index);
    setSikomi(updatedSikomi);
  };

  /**
   * rhメモ更新
   * @param index index
   * @param value rhメモ内容
   */
  const handleRhMemChange = (index: number, value: string) => {
    setRh((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  /**
   * rh指定日削除
   * @param index index
   */
  const handleRhRemove = (index: number) => {
    setDeleteList((prev) => [...prev, rh[index]]);
    const updatedRh = rh.filter((_, i) => i !== index);
    setRh(updatedRh);
  };

  /**
   * gpメモ更新
   * @param index index
   * @param value gpメモ内容
   */
  const handleGpMemChange = (index: number, value: string) => {
    setGp((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  /**
   * gp指定日削除
   * @param index index
   */
  const handleGpRemove = (index: number) => {
    setDeleteList((prev) => [...prev, gp[index]]);
    const updatedGp = gp.filter((_, i) => i !== index);
    setGp(updatedGp);
  };

  /**
   * 本番追加日数更新
   * @param index index
   * @param value 本番追加日数
   */
  const handleHonbanAddChange = (index: number, value: number) => {
    setHonban((prev) => prev.map((d, i) => (i === index ? { ...d, juchuHonbanbiAddQty: value } : d)));
  };
  /**
   * 本番メモ更新
   * @param index index
   * @param value 本番メモ内容
   */
  const handleHonbanMemChange = (index: number, value: string) => {
    setHonban((prev) => prev.map((d, i) => (i === index ? { ...d, mem: value } : d)));
  };
  /**
   * 本番指定日削除
   * @param index index
   */
  const handleHonbanRemove = (index: number) => {
    setDeleteList((prev) => [...prev, honban[index]]);
    const updatedHonban = honban.filter((_, i) => i !== index);
    setHonban(updatedHonban);
  };

  /**
   * 保存ボタン押下
   */
  const handleSave = async () => {
    const juchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [...sikomi, ...rh, ...gp, ...honban];
    onSave(juchuHonbanbiData, deleteList);
  };

  /**
   * 戻るボタン押下
   */
  const handleClose = () => {
    setDeleteList([]);
    onClose();
  };

  /**
   * 追加ボタン押下
   * @param value タブ値
   */
  const handleAddInput = (value: number) => {
    if (dateRange !== null) {
      // カレンダーで選択された日付
      const newDates = getRange(dateRange[0], dateRange[1]);

      switch (value) {
        // 仕込
        case 10:
          const updatedSikomi: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 10,
            juchuHonbanbiDat: d,
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setSikomi((prev) => {
            const existDate = new Set(prev.map((d) => d.juchuHonbanbiDat));
            const unique = updatedSikomi.filter((d) => !existDate.has(d.juchuHonbanbiDat));
            return [...prev, ...unique].sort(
              (a, b) => new Date(a.juchuHonbanbiDat).getTime() - new Date(b.juchuHonbanbiDat).getTime()
            );
          });
          break;
        // rh
        case 20:
          const updatedRh: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 20,
            juchuHonbanbiDat: d,
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setRh((prev) => {
            const existDate = new Set(prev.map((d) => d.juchuHonbanbiDat));
            const unique = updatedRh.filter((d) => !existDate.has(d.juchuHonbanbiDat));
            return [...prev, ...unique].sort(
              (a, b) => new Date(a.juchuHonbanbiDat).getTime() - new Date(b.juchuHonbanbiDat).getTime()
            );
          });
          break;
        // gp
        case 30:
          const updatedGp: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 30,
            juchuHonbanbiDat: d,
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setGp((prev) => {
            const existDate = new Set(prev.map((d) => d.juchuHonbanbiDat));
            const unique = updatedGp.filter((d) => !existDate.has(d.juchuHonbanbiDat));
            return [...prev, ...unique].sort(
              (a, b) => new Date(a.juchuHonbanbiDat).getTime() - new Date(b.juchuHonbanbiDat).getTime()
            );
          });
          break;
        // 本番
        case 40:
          const updatedHonban: JuchuKizaiHonbanbiValues[] = newDates.map((d) => ({
            juchuHeadId: juchuHeadId,
            juchuKizaiHeadId: juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 40,
            juchuHonbanbiDat: d,
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setHonban((prev) => {
            const existDate = new Set(prev.map((d) => d.juchuHonbanbiDat));
            const unique = updatedHonban.filter((d) => !existDate.has(d.juchuHonbanbiDat));
            return [...prev, ...unique].sort(
              (a, b) => new Date(a.juchuHonbanbiDat).getTime() - new Date(b.juchuHonbanbiDat).getTime()
            );
          });
          break;
      }
    }
  };

  /**
   * 選択日更新
   * @param range 指定日付
   */
  const handleDateChange = (range: [Date, Date] | null) => {
    setDateRange(range);
  };

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
              <TextField value={data.juchuHonbanbiDat} />
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
              <TextField value={data.juchuHonbanbiDat} />
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
              <TextField value={data.juchuHonbanbiDat} />
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
              <TextField value={data.juchuHonbanbiDat} />
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
