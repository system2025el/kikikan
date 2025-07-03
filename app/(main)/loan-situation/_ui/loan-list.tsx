'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { BackButton } from '../../_ui/buttons';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { loanList } from '../_lib/data';
import { LoanListTable } from './loan-list-table';

export type Loan = {
  kizaiId: number;
  kizaiNam: string;
  shozokuId: number;
  stock: number;
  bumonId: number;
  daibumonId: number;
  shukeiBumonId: number;
  regAmt: number;
  rankAmt1: number;
  rankAmt2: number;
  rankAmt3: number;
  rankAmt4: number;
  rankAmt5: number;
  mem: string;
};

const testData: Loan[] = Array.from({ length: 100 }, (_, i) => {
  const original = loanList[i % loanList.length];
  return {
    ...original,
    kizaiId: i + 1,
    kizaiNam: `${original.kizaiNam} (${i + 1})`,
    shozokuId: original.shozokuId,
    stock: original.stock,
    bumonId: original.bumonId,
    daibumonId: original.daibumonId,
    shukeiBumonId: original.shukeiBumonId,
    regAmt: original.regAmt,
    rankAmt1: original.rankAmt1,
    rankAmt2: original.rankAmt2,
    rankAmt3: original.rankAmt3,
    rankAmt4: original.rankAmt4,
    rankAmt5: original.rankAmt5,
    mem: original.mem,
  };
});

export const LoanList = () => {
  const [rows, setRows] = useState(loanList);

  // 行移動
  const moveRow = (index: number, direction: number) => {
    console.log(index);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;

    const updatedRows = [...rows];
    [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
    setRows(updatedRows);
  };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <BackButton label={'戻る'} />
      </Box>
      {/*貸出状況検索*/}
      <Paper variant="outlined">
        <Grid2 container spacing={2} alignItems="center" p={2}>
          <Typography>貸出状況</Typography>
          <Typography>機材検索</Typography>
        </Grid2>
        <Divider />
        <Box p={2}>
          <Typography variant="body2">検索</Typography>
        </Box>
        <Grid2 container alignItems={'center'} p={2} spacing={2}>
          <Typography>受注機材名キーワード</Typography>
          <TextField />
          <Button>
            <SearchIcon fontSize="small" />
            検索
          </Button>
        </Grid2>
      </Paper>
      <LoanListTable datas={rows} moveRow={moveRow} />
    </Box>
  );
};
