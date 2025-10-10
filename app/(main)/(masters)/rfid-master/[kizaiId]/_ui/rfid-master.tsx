'use client';

import SaveAsIcon from '@mui/icons-material/SaveAs';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';

import { BackButton } from '../../../../_ui/buttons';
import { RfidsMasterTableValues } from '../_lib/types';
import { RfidMasterTable } from './rfid-master-table';

export const RfidMaster = ({
  rfids,
  sts,
  kizai,
}: {
  rfids: RfidsMasterTableValues[] | undefined;
  sts: SelectTypes[] | undefined;
  kizai: { id: number; nam: string };
}) => {
  // useState
  const [theRfids, setTheRfids] = useState<RfidsMasterTableValues[] | undefined>(rfids);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* 選択される機材のidのリスト */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  /* */
  const [theSts, setTheSts] = useState<number>();
  /* methods ------------------------------------------ */
  /* 適用ボタン押下時の処理 */
  const handleClickAdapt = async (tagList: string[], selectedSts: number) => {
    console.log('タグリスト', tagList, 'ステータス', selectedSts);
  };
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>機材詳細</Typography>
          <Box>
            <Button disabled={false} onClick={() => {}} sx={{ alignItems: 'center' }}>
              <SaveAsIcon fontSize="small" />
              保存
            </Button>
          </Box>
        </Box>
        <Divider />
        <Box width={'100%'} pb={1}>
          <Box sx={styles.container}>
            <Typography mr={3}>機材名</Typography>
            <TextField value={kizai.nam} disabled />
          </Box>
          <Box sx={styles.container}>
            <Typography mr={3}>機材ステータス一括変更</Typography>
            <Select
              value={theSts ?? ''}
              onChange={(event) => {
                const value = Number(event.target.value);
                setTheSts(value);
              }}
              sx={{ width: 200 }}
            >
              {sts?.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
            <Button
              sx={{ ml: 1 }}
              onClick={() => handleClickAdapt(selectedTags, theSts!)}
              disabled={!sts || selectedTags.length === 0}
            >
              適用
            </Button>
          </Box>
        </Box>
      </Paper>
      <RfidMasterTable
        rfids={theRfids}
        kizaiId={kizai.id}
        page={page}
        isLoading={isLoading}
        setPage={setPage}
        setIsLoading={setIsLoading}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
      />
    </Container>
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
    marginLeft: 2,
    marginRight: 2,
    marginTop: 1,
  },
};
