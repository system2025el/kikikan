'use client';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Box, Button, Container, Divider, Fab, Grid2, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useRef, useState } from 'react';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getRange } from '@/app/(main)/_lib/date-funcs';
import { RSuiteDateRangePicker } from '@/app/(main)/_ui/date';

import { JuchuKizaiHonbanbiValues } from '../_lib/types';
import { TabPanelUI } from './date-selection-dialog-tabpanel';

type TabPanelProps = {
  children?: React.ReactNode;
  index: number;
  value: number;
};

type DateDialogProps = {
  juchuHeadId: number;
  juchuKizaiHeadId: number;
  shukoDate: Date | null;
  nyukoDate: Date | null;
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
  juchuHonbanbiDeleteList: JuchuKizaiHonbanbiValues[];
  scrollRef: React.RefObject<HTMLDivElement | null>;
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
  scrollRef,
  onClose,
  onSave,
}: DateDialogProps) => {
  // 保存中
  const [isSave, setIsSave] = useState(false);
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
   * 仕込み追加日数更新
   * @param index index
   * @param value 仕込み追加日数
   */
  const handleSikomiAddChange = (index: number, value: number) => {
    setSikomi((prev) => prev.map((d, i) => (i === index ? { ...d, juchuHonbanbiAddQty: value } : d)));
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
   * Rh追加日数更新
   * @param index index
   * @param value Rh追加日数
   */
  const handleRhAddChange = (index: number, value: number) => {
    setRh((prev) => prev.map((d, i) => (i === index ? { ...d, juchuHonbanbiAddQty: value } : d)));
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
   * Gp追加日数更新
   * @param index index
   * @param value Gp追加日数
   */
  const handleGpAddChange = (index: number, value: number) => {
    setGp((prev) => prev.map((d, i) => (i === index ? { ...d, juchuHonbanbiAddQty: value } : d)));
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
  const handleSave = () => {
    setIsSave(true);
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
            juchuHonbanbiDat: new Date(d),
            mem: '',
            juchuHonbanbiAddQty: 0,
          }));
          setSikomi((prev) => {
            const existDate = new Set(prev.map((d) => toJapanYMDString(d.juchuHonbanbiDat)));
            const unique = updatedSikomi.filter((d) => !existDate.has(toJapanYMDString(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
        // rh
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
            const existDate = new Set(prev.map((d) => toJapanYMDString(d.juchuHonbanbiDat)));
            const unique = updatedRh.filter((d) => !existDate.has(toJapanYMDString(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
        // gp
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
            const existDate = new Set(prev.map((d) => toJapanYMDString(d.juchuHonbanbiDat)));
            const unique = updatedGp.filter((d) => !existDate.has(toJapanYMDString(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
          });
          break;
        // 本番
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
            const existDate = new Set(prev.map((d) => toJapanYMDString(d.juchuHonbanbiDat)));
            const unique = updatedHonban.filter((d) => !existDate.has(toJapanYMDString(d.juchuHonbanbiDat)));
            return [...prev, ...unique].sort((a, b) => a.juchuHonbanbiDat.getTime() - b.juchuHonbanbiDat.getTime());
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

  /** ダイアログ上部へ */
  const scrollToTop = () => {
    console.log('ref==============================', scrollRef);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%', p: 3, overflowY: 'auto' }} maxWidth={'xl'} ref={scrollRef}>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <Button onClick={handleClose}>戻る</Button>
      </Box>
      <Paper variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2}>
          <Typography>日付選択</Typography>
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
          <Box ml={10}>
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
          <TabPanelUI
            JuchuKizaiHonbanbiData={sikomi}
            handleAddChange={handleSikomiAddChange}
            handleMemChange={handleSikomiMemChange}
            handleRemove={handleSikomiRemove}
          />
        </TabPanel>
        <TabPanel value={value} index={20}>
          <TabPanelUI
            JuchuKizaiHonbanbiData={rh}
            handleAddChange={handleRhAddChange}
            handleMemChange={handleRhMemChange}
            handleRemove={handleRhRemove}
          />
        </TabPanel>
        <TabPanel value={value} index={30}>
          <TabPanelUI
            JuchuKizaiHonbanbiData={gp}
            handleAddChange={handleGpAddChange}
            handleMemChange={handleGpMemChange}
            handleRemove={handleGpRemove}
          />
        </TabPanel>
        <TabPanel value={value} index={40}>
          <TabPanelUI
            JuchuKizaiHonbanbiData={honban}
            handleAddChange={handleHonbanAddChange}
            handleMemChange={handleHonbanMemChange}
            handleRemove={handleHonbanRemove}
          />
        </TabPanel>
      </Paper>
      {/** 固定ボタン 保存＆ページトップ */}
      <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
        <Fab
          variant="extended"
          color="primary"
          type="submit"
          sx={{ mr: 2 }}
          onClick={() => {
            handleSave();
          }}
          disabled={isSave}
        >
          <SaveAsIcon sx={{ mr: 1 }} />
          保存
        </Fab>
        <Fab color="primary" onClick={() => scrollToTop()}>
          <ArrowUpwardIcon />
        </Fab>
      </Box>
    </Container>
  );
};
