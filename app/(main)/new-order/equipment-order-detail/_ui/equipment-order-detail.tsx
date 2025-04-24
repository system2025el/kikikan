'use client';

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRef, useState } from 'react';
import React from 'react';

import Date from '@/app/(main)/_ui/date';
import Grid, { EditableGridHandle } from '@/app/(main)/_ui/grid';
import Time from '@/app/(main)/_ui/time';
import { columns, rows } from '@/app/(main)/new-order/equipment-order-detail/_lib/data';

const EquipmentOrderDetail = () => {
  const [selectStatus, setSelectStatus] = useState('入力中');
  const [selectIssueBase, setSelectIssueBase] = useState('KICKS');
  const [selectReturnBase, setSelectReturnBase] = useState('YARD');

  const selectStatusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };
  const selectIssueBaseChange = (event: SelectChangeEvent) => {
    setSelectIssueBase(event.target.value);
  };
  const selectReturnBaseChange = (event: SelectChangeEvent) => {
    setSelectReturnBase(event.target.value);
  };

  const gridRef = useRef<EditableGridHandle>(null);

  const handleClick = () => {
    const data = gridRef.current?.getData();
    console.log(data);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'gray' }}>
        <Typography margin={1}>受注明細（機材）</Typography>
        <Box>
          <Button variant="contained" sx={{ margin: 1 }}>
            編集
          </Button>
          <Button variant="contained" sx={{ margin: 1 }} onClick={handleClick}>
            保存
          </Button>
        </Box>
        <Button variant="contained" sx={{ margin: 1 }} href="/new-order">
          戻る
        </Button>
      </Box>
      <Box display="flex" sx={{ bgcolor: 'lightgray' }}>
        <Stack sx={{ width: '60%' }}>
          <Box sx={styles.container}>
            <Typography marginRight={3} whiteSpace="nowrap">
              受注番号
            </Typography>
            <TextField size="small" disabled></TextField>
            <Typography mx={2} whiteSpace="nowrap">
              受注ステータス
            </Typography>
            <TextField size="small" disabled>
              確定
            </TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={5} whiteSpace="nowrap">
              受注日
            </Typography>
            <TextField size="small" disabled></TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={5} whiteSpace="nowrap">
              入力者
            </Typography>
            <TextField size="small" disabled></TextField>
          </Box>
        </Stack>
        <Stack sx={{ width: '40%' }}>
          <Box sx={styles.container}>
            <Typography marginRight={5} whiteSpace="nowrap">
              公演名
            </Typography>
            <TextField size="small" defaultValue="A/Zepp Tour"></TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={3} whiteSpace="nowrap">
              公演場所
            </Typography>
            <TextField size="small" defaultValue="Zepp Osaka"></TextField>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={7} whiteSpace="nowrap">
              相手
            </Typography>
            <TextField size="small" defaultValue="(株)シアターブレーン"></TextField>
          </Box>
        </Stack>
      </Box>
      <Box display="flex" marginTop={2} sx={{ bgcolor: 'lightgray' }}>
        <Stack sx={{ width: '100%' }}>
          <Typography whiteSpace="nowrap">機材入力</Typography>
          <Box display="flex" alignItems="center" margin={1} marginLeft={17}>
            <Button variant="contained" sx={{ marginRight: 4 }}>
              ＋ 機材追加
            </Button>
            <Button variant="contained">受注機材・スケジュール</Button>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={11} whiteSpace="nowrap">
              機材
            </Typography>
            <Grid ref={gridRef} columns={columns} rows={rows} />
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={1} whiteSpace="nowrap">
              機材ステータス
            </Typography>
            <FormControl size="small" sx={{ width: '10%' }}>
              <Select value={selectStatus} onChange={selectStatusChange}>
                <MenuItem value={'入力中'}>入力中</MenuItem>
                <MenuItem value={'準備可'}>準備可</MenuItem>
                <MenuItem value={'作業中'}>作業中</MenuItem>
                <MenuItem value={'OK'}>OK</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={styles.container} width="60%">
            <Typography marginRight={9} whiteSpace="nowrap">
              出庫日
            </Typography>
            <Date />
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              時刻
            </Typography>
            <Time />
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              拠点
            </Typography>
            <FormControl size="small" sx={{ width: '25%' }}>
              <Select value={selectIssueBase} onChange={selectIssueBaseChange}>
                <MenuItem value={'KICKS'}>KICKS</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={styles.container} width="60%">
            <Typography marginRight={9} whiteSpace="nowrap">
              返却日
            </Typography>
            <Date />
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              時刻
            </Typography>
            <Time />
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              拠点
            </Typography>
            <FormControl size="small" sx={{ width: '25%' }}>
              <Select value={selectReturnBase} onChange={selectReturnBaseChange}>
                <MenuItem value={'YARD'}>YARD</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={7} whiteSpace="nowrap">
              本番日数
            </Typography>
            <TextField size="small" defaultValue="4" sx={{ width: '5%' }} />日
          </Box>
          <Box sx={styles.container}>
            <Typography marginRight={9} whiteSpace="nowrap">
              本番日
            </Typography>
            <Button value="仕込" size="small" sx={{ color: 'white', bgcolor: 'blue' }}>
              仕込
            </Button>
            <Button value="RH" size="small" sx={{ color: 'white', bgcolor: 'green', marginLeft: 2 }}>
              RH
            </Button>
            <Button value="GP" size="small" sx={{ color: 'white', bgcolor: 'green', marginLeft: 2 }}>
              GP
            </Button>
            <Button value="本番" size="small" sx={{ color: 'white', bgcolor: 'pink', marginLeft: 2 }}>
              本番
            </Button>
            <TextField disabled size="small" sx={{ marginLeft: 4 }} />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default EquipmentOrderDetail;

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 1,
    marginLeft: 2,
  },
  // ボタン
  button: {},
};
