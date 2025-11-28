'use client';

import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Grid2,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';

import { JuchuContainerMeisaiValues, JuchuKizaiMeisaiValues } from '../_lib/types';

export const SeparationDialog = ({
  juchuKizaiMeisaiList,
  juchuContainerMeisaiList,
  handleSeparationConfirmed,
  handleCloseSeparationDialog,
}: {
  juchuKizaiMeisaiList: JuchuKizaiMeisaiValues[];
  juchuContainerMeisaiList: JuchuContainerMeisaiValues[];
  handleSeparationConfirmed: (
    headNam: string,
    selectEq: JuchuKizaiMeisaiValues[],
    selectCtn: JuchuContainerMeisaiValues[]
  ) => void;
  handleCloseSeparationDialog: () => void;
}) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 機材明細名
  const [headNam, setHeadNam] = useState('');
  // 機材選択
  const [selectedEq, setSelectedEq] = useState<number[]>([]);
  // コンテナ選択
  const [selectedCtn, setSelectedCtn] = useState<number[]>([]);
  // エラー
  const [errors, setErrors] = useState({
    headNam: '',
  });

  // 機材チェックボックス押下
  const handleSelectEq = (dspOrdNum: number) => {
    const newSelected = selectedEq.includes(dspOrdNum)
      ? selectedEq.filter((item) => item !== dspOrdNum)
      : [...selectedEq, dspOrdNum];

    setSelectedEq(newSelected);
  };

  // コンテナチェックボックス押下
  const handleSelectCtn = (dspOrdNum: number) => {
    const newSelected = selectedCtn.includes(dspOrdNum)
      ? selectedCtn.filter((item) => item !== dspOrdNum)
      : [...selectedCtn, dspOrdNum];

    setSelectedCtn(newSelected);
  };

  // 確定ボタン押下
  const handleClickConfirmed = async () => {
    if (!headNam) {
      setErrors((prev) => ({ ...prev, headNam: validationMessages.required() }));
      return;
    }

    setIsLoading(true);
    const selectEqData = juchuKizaiMeisaiList.filter((data) => selectedEq.includes(data.dspOrdNum));
    const selectContainerData = juchuContainerMeisaiList.filter((data) => selectedCtn.includes(data.dspOrdNum));
    await handleSeparationConfirmed(headNam, selectEqData, selectContainerData);
    setIsLoading(false);
  };

  return (
    <Container sx={{ p: 1 }}>
      <Typography>分離</Typography>
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
        <Box display={'flex'}>
          {juchuKizaiMeisaiList.length > 0 && (
            <TableContainer
              sx={{
                overflow: 'auto',
                maxHeight: '60vh',
                maxWidth: juchuContainerMeisaiList.length > 0 ? '60%' : '100%',
                mr: juchuContainerMeisaiList.length > 0 ? 2 : 0,
              }}
            >
              <Table stickyHeader aria-labelledby="tableTitle" size="small">
                <TableHead sx={{ bgcolor: 'primary.light' }}>
                  <TableRow sx={{ whiteSpace: 'nowrap' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedEq.length > 0 && selectedEq.length < juchuKizaiMeisaiList.length}
                        checked={selectedEq.length === juchuKizaiMeisaiList.length}
                        onChange={(e) => {
                          const newSelectedEq = e.target.checked
                            ? juchuKizaiMeisaiList.map((row) => row.dspOrdNum)
                            : [];
                          setSelectedEq(newSelectedEq);
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">機材名</TableCell>
                    <TableCell align="right">受注</TableCell>
                    <TableCell align="right">予備</TableCell>
                    <TableCell align="right">受注</TableCell>
                    <TableCell align="right">予備</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {juchuKizaiMeisaiList.map((row, index) => (
                    <TableRow hover key={index}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedEq.includes(row.dspOrdNum)}
                          onChange={() => handleSelectEq(row.dspOrdNum)}
                        />
                      </TableCell>
                      <TableCell align="left">{row.kizaiNam}</TableCell>
                      <TableCell align="right">{row.planKizaiQty}</TableCell>
                      <TableCell align="right">{row.planYobiQty}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          slotProps={{
                            input: {
                              sx: {
                                height: 25,
                                fontSize: 'small',
                              },
                            },
                          }}
                          sx={{
                            width: '60px',
                            '& .MuiInputBase-input': {
                              padding: 1,
                              textAlign: 'right',
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          slotProps={{
                            input: {
                              sx: {
                                height: 25,
                                fontSize: 'small',
                              },
                            },
                          }}
                          sx={{
                            width: '60px',
                            '& .MuiInputBase-input': {
                              padding: 1,
                              textAlign: 'right',
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {juchuContainerMeisaiList.length > 0 && (
            <TableContainer
              sx={{ overflow: 'auto', maxHeight: '60vh', maxWidth: juchuKizaiMeisaiList.length > 0 ? '40%' : '100%' }}
            >
              <Table stickyHeader aria-labelledby="tableTitle" size="small">
                <TableHead sx={{ bgcolor: 'primary.light' }}>
                  <TableRow sx={{ whiteSpace: 'nowrap' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedCtn.length > 0 && selectedCtn.length < juchuContainerMeisaiList.length}
                        checked={selectedCtn.length === juchuContainerMeisaiList.length}
                        onChange={(e) => {
                          const newSelectedCtn = e.target.checked
                            ? juchuContainerMeisaiList.map((row) => row.dspOrdNum)
                            : [];
                          setSelectedCtn(newSelectedCtn);
                        }}
                      />
                    </TableCell>
                    <TableCell align="left">機材名</TableCell>
                    <TableCell align="right">K</TableCell>
                    <TableCell align="right">Y</TableCell>
                    <TableCell align="right">K</TableCell>
                    <TableCell align="right">Y</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {juchuContainerMeisaiList.map((row, index) => (
                    <TableRow hover key={index}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedCtn.includes(row.dspOrdNum)}
                          onChange={() => handleSelectCtn(row.dspOrdNum)}
                        />
                      </TableCell>
                      <TableCell align="left">{row.kizaiNam}</TableCell>
                      <TableCell align="right">{row.planKicsKizaiQty}</TableCell>
                      <TableCell align="right">{row.planYardKizaiQty}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          slotProps={{
                            input: {
                              sx: {
                                height: 25,
                                fontSize: 'small',
                              },
                            },
                          }}
                          sx={{
                            width: '60px',
                            '& .MuiInputBase-input': {
                              padding: 1,
                              textAlign: 'right',
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          slotProps={{
                            input: {
                              sx: {
                                height: 25,
                                fontSize: 'small',
                              },
                            },
                          }}
                          sx={{
                            width: '60px',
                            '& .MuiInputBase-input': {
                              padding: 1,
                              textAlign: 'right',
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
      <Box display={'flex'} justifyContent={'end'} my={1}>
        <Grid2 container spacing={2}>
          <Button onClick={handleClickConfirmed}>確定</Button>
          <Button onClick={handleCloseSeparationDialog}>戻る</Button>
        </Grid2>
      </Box>
    </Container>
  );
};
