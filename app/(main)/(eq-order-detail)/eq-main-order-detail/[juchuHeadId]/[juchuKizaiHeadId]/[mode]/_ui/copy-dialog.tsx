'use client';

import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';

import { JuchuContainerMeisaiValues, JuchuKizaiMeisaiValues } from '../_lib/types';

export const CopyDialog = ({
  juchuKizaiMeisaiList,
  juchuContainerMeisaiList,
  handleCopyConfirmed,
  handleCloseCopyDialog,
}: {
  juchuKizaiMeisaiList: JuchuKizaiMeisaiValues[];
  juchuContainerMeisaiList: JuchuContainerMeisaiValues[];
  handleCopyConfirmed: (
    headNam: string,
    selectEq: JuchuKizaiMeisaiValues[],
    selectCtn: JuchuContainerMeisaiValues[]
  ) => void;
  handleCloseCopyDialog: () => void;
}) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 機材明細名
  const [headNam, setHeadNam] = useState('');
  // 選択
  const [selected, setSelected] = useState<number[]>([]);
  // エラー
  const [errors, setErrors] = useState({
    headNam: '',
  });

  const handleSelect = (dspOrdNum: number) => {
    const newSelected = selected.includes(dspOrdNum)
      ? selected.filter((item) => item !== dspOrdNum)
      : [...selected, dspOrdNum];

    setSelected(newSelected);
  };

  const handleClickConfirmed = async () => {
    if (!headNam) {
      setErrors((prev) => ({ ...prev, headNam: validationMessages.required() }));
      return;
    }
    setIsLoading(true);
    const selectEqData = juchuKizaiMeisaiList.filter((data) => selected.includes(data.dspOrdNum));
    const selectContainerData = juchuContainerMeisaiList.filter((data) => selected.includes(data.dspOrdNum));
    await handleCopyConfirmed(headNam, selectEqData, selectContainerData);
    setIsLoading(false);
  };

  return (
    <Container sx={{ p: 1 }}>
      <Typography>コピー</Typography>
      {isLoading && <LoadingOverlay />}
      <Paper variant="outlined">
        <Grid2 container alignItems={'baseline'} spacing={2} p={1}>
          <Typography>機材明細名</Typography>
          <TextField
            value={headNam}
            onChange={(e) => {
              setHeadNam(e.target.value);
              setErrors((prev) => ({ ...prev, headNam: '' }));
            }}
            error={Boolean(errors.headNam)}
            helperText={errors.headNam}
          />
        </Grid2>
        <Divider />
        <TableContainer sx={{ overflow: 'auto', maxHeight: '60vh' }}>
          <Table stickyHeader aria-labelledby="tableTitle" size="small">
            <TableHead sx={{ bgcolor: 'primary.light' }}>
              <TableRow sx={{ whiteSpace: 'nowrap' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selected.length > 0 &&
                      selected.length < juchuKizaiMeisaiList.length + juchuContainerMeisaiList.length
                    }
                    checked={selected.length === juchuKizaiMeisaiList.length + juchuContainerMeisaiList.length}
                    onChange={(e) => {
                      const newSelectedEq = e.target.checked ? juchuKizaiMeisaiList.map((row) => row.dspOrdNum) : [];
                      const newSelectedCtn = e.target.checked
                        ? juchuContainerMeisaiList.map((row) => row.dspOrdNum)
                        : [];
                      setSelected([...newSelectedEq, ...newSelectedCtn]);
                    }}
                  />
                </TableCell>
                <TableCell align="left">機材名</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {juchuKizaiMeisaiList.map((row, index) => (
                <TableRow hover key={index}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.includes(row.dspOrdNum)} onChange={() => handleSelect(row.dspOrdNum)} />
                  </TableCell>
                  <TableCell align="left">{row.kizaiNam}</TableCell>
                </TableRow>
              ))}
              {juchuContainerMeisaiList.map((row, index) => (
                <TableRow hover key={index}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selected.includes(row.dspOrdNum)} onChange={() => handleSelect(row.dspOrdNum)} />
                  </TableCell>
                  <TableCell align="left">{row.kizaiNam}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Box display={'flex'} justifyContent={'end'} my={1}>
        <Grid2 container spacing={2}>
          <Button disabled={selected.length === 0} onClick={handleClickConfirmed}>
            確定
          </Button>
          <Button onClick={handleCloseCopyDialog}>戻る</Button>
        </Grid2>
      </Box>
    </Container>
  );
};
