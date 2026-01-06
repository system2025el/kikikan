'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';

import {
  DialogSchema,
  DialogValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiMeisaiValues,
  SeparationCtn,
  SeparationEq,
} from '../_lib/types';

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
  const inputEqOrderRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputEqYobiRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputCtnKRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputCtnYRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 分離機材
  const [separationEq, setSeparationEq] = useState<SeparationEq[]>(
    juchuKizaiMeisaiList.map((data) => ({ ...data, separatePlanKizaiQty: 0, separatePlanYobiQty: 0 }))
  );
  // 分離コンテナ
  const [separationCtn, setSeparationCtn] = useState<SeparationCtn[]>(
    juchuContainerMeisaiList.map((data) => ({ ...data, separatePlanKicsKizaiQty: 0, separatePlanYardKizaiQty: 0 }))
  );
  // 機材選択
  const [selectedEq, setSelectedEq] = useState<number[]>([]);
  // コンテナ選択
  const [selectedCtn, setSelectedCtn] = useState<number[]>([]);

  /* useForm ------------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      headNam: '',
    },
    resolver: zodResolver(DialogSchema),
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
  const onSubmit = async (data: DialogValues) => {
    setIsLoading(true);
    // 選択機材
    const selectEqData = separationEq.filter((data) => selectedEq.includes(data.dspOrdNum));
    // 選択コンテナ
    const selectContainerData = separationCtn.filter((data) => selectedCtn.includes(data.dspOrdNum));

    // 入力された数値を受注数、予備数、合計数に入れる
    const updateEq: JuchuKizaiMeisaiValues[] = selectEqData.map((d) => ({
      ...d,
      planKizaiQty: d.separatePlanKizaiQty,
      planYobiQty: d.separatePlanYobiQty,
      planQty: d.separatePlanKizaiQty + d.separatePlanYobiQty,
    }));
    const updateCtn: JuchuContainerMeisaiValues[] = selectContainerData.map((d) => ({
      ...d,
      planKicsKizaiQty: d.separatePlanKicsKizaiQty,
      planYardKizaiQty: d.separatePlanYardKizaiQty,
      planQty: d.separatePlanKicsKizaiQty + d.separatePlanYardKizaiQty,
    }));

    await handleSeparationConfirmed(data.headNam, updateEq, updateCtn);
    setIsLoading(false);
  };

  const handleEqOrderRef = (rowIndex: number, e: HTMLInputElement | null) => {
    inputEqOrderRefs.current[rowIndex] = e;
  };

  const handleEqOrderKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputEqOrderRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputEqOrderRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputEqOrderRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      inputEqYobiRefs.current[rowIndex]?.focus();
    }
  };

  const handleEqYobiRef = (rowIndex: number, e: HTMLInputElement | null) => {
    inputEqYobiRefs.current[rowIndex] = e;
  };

  const handleEqYobiKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputEqYobiRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputEqYobiRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputEqYobiRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      inputEqOrderRefs.current[rowIndex]?.focus();
    }
  };

  const handleCtnKRef = (rowIndex: number, e: HTMLInputElement | null) => {
    inputCtnKRefs.current[rowIndex] = e;
  };

  const handleCtnKKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputCtnKRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputCtnKRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputCtnKRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      inputCtnYRefs.current[rowIndex]?.focus();
    }
  };

  const handleCtnYRef = (rowIndex: number, e: HTMLInputElement | null) => {
    inputCtnYRefs.current[rowIndex] = e;
  };

  const handleCtnYKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputCtnYRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputCtnYRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputCtnYRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      inputCtnKRefs.current[rowIndex]?.focus();
    }
  };

  return (
    <Container sx={{ p: 1 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Typography>分離</Typography>
        {isLoading && <LoadingOverlay />}
        <Paper variant="outlined">
          <Grid2 container alignItems={'baseline'} spacing={2} p={1}>
            <Typography>受注明細名</Typography>
            <TextFieldElement name="headNam" control={control} />
          </Grid2>
          <Box display={'flex'}>
            {separationEq.length > 0 && (
              <TableContainer
                sx={{
                  overflow: 'auto',
                  maxHeight: '60vh',
                  maxWidth: separationCtn.length > 0 ? '60%' : '100%',
                  mr: separationCtn.length > 0 ? 2 : 0,
                }}
              >
                <Table stickyHeader aria-labelledby="tableTitle" size="small">
                  <TableHead sx={{ bgcolor: 'primary.light' }}>
                    <TableRow sx={{ whiteSpace: 'nowrap' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedEq.length > 0 && selectedEq.length < separationEq.length}
                          checked={selectedEq.length === separationEq.length}
                          onChange={(e) => {
                            const newSelectedEq = e.target.checked ? separationEq.map((row) => row.dspOrdNum) : [];
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
                    {separationEq.map((row, index) => (
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
                            value={row.separatePlanKizaiQty}
                            type="number"
                            onChange={(e) => {
                              if (Number(e.target.value) <= row.planKizaiQty) {
                                setSeparationEq((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, separatePlanKizaiQty: Number(e.target.value) } : d
                                  )
                                );
                              }
                            }}
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
                            inputRef={(e) => handleEqOrderRef(index, e)}
                            onKeyDown={(e) => {
                              handleEqOrderKeyDown(e, index);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            value={row.separatePlanYobiQty}
                            type="number"
                            onChange={(e) => {
                              if (Number(e.target.value) <= row.planYobiQty) {
                                setSeparationEq((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, separatePlanYobiQty: Number(e.target.value) } : d
                                  )
                                );
                              }
                            }}
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
                            inputRef={(e) => handleEqYobiRef(index, e)}
                            onKeyDown={(e) => {
                              handleEqYobiKeyDown(e, index);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {separationCtn.length > 0 && (
              <TableContainer
                sx={{ overflow: 'auto', maxHeight: '60vh', maxWidth: separationEq.length > 0 ? '40%' : '100%' }}
              >
                <Table stickyHeader aria-labelledby="tableTitle" size="small">
                  <TableHead sx={{ bgcolor: 'primary.light' }}>
                    <TableRow sx={{ whiteSpace: 'nowrap' }}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          indeterminate={selectedCtn.length > 0 && selectedCtn.length < separationCtn.length}
                          checked={selectedCtn.length === separationCtn.length}
                          onChange={(e) => {
                            const newSelectedCtn = e.target.checked ? separationCtn.map((row) => row.dspOrdNum) : [];
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
                    {separationCtn.map((row, index) => (
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
                            value={row.separatePlanKicsKizaiQty}
                            type="number"
                            onChange={(e) => {
                              if (Number(e.target.value) <= row.planKicsKizaiQty) {
                                setSeparationCtn((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, separatePlanKicsKizaiQty: Number(e.target.value) } : d
                                  )
                                );
                              }
                            }}
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
                            inputRef={(e) => handleCtnKRef(index, e)}
                            onKeyDown={(e) => {
                              handleCtnKKeyDown(e, index);
                            }}
                            onFocus={(e) => e.target.select()}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            value={row.separatePlanYardKizaiQty}
                            type="number"
                            onChange={(e) => {
                              if (Number(e.target.value) <= row.planYardKizaiQty) {
                                setSeparationCtn((prev) =>
                                  prev.map((d, i) =>
                                    i === index ? { ...d, separatePlanYardKizaiQty: Number(e.target.value) } : d
                                  )
                                );
                              }
                            }}
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
                            inputRef={(e) => handleCtnYRef(index, e)}
                            onKeyDown={(e) => {
                              handleCtnYKeyDown(e, index);
                            }}
                            onFocus={(e) => e.target.select()}
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
            <Button type="submit" disabled={selectedEq.length + selectedCtn.length === 0} loading={isLoading}>
              確定
            </Button>
            <Button onClick={handleCloseSeparationDialog}>戻る</Button>
          </Grid2>
        </Box>
      </form>
    </Container>
  );
};
