'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Divider,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { permission } from '../../_lib/permission';
import { Loading } from '../../_ui/loading';
import { PermissionGuard } from '../../_ui/permission-guard';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { ROWS_PER_MASTER_TABLE_PAGE } from '../../(masters)/_lib/constants';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { getFilteredEqpts } from '../_lib/funcs';
import { LoanEqTableValues } from '../_lib/types';

export const LoanList = () => {
  /** 表示する行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState -------------------------------------- */
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LoanEqTableValues[]>([]);

  /* useForm ---------------------------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* 検索ボタン押下時 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredEqpts(data.query!);
    setPage(1);
    setRows(newList);
    console.log('newList : ', newList);
    setIsLoading(false);
  };

  // 行移動
  // const moveRow = (index: number, direction: number) => {
  //   console.log(index);
  //   const newIndex = index + direction;
  //   if (newIndex < 0 || newIndex >= rows.length) return;

  //   const updatedRows = [...rows];
  //   [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
  //   setRows(updatedRows);
  // };

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? rows.slice((page - 1) * rowsPerPage, page * rowsPerPage) : rows),
    [page, rows, rowsPerPage]
  );

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const eqpts = await getFilteredEqpts();
      const data = eqpts.filter((d) => !d.delFlg && d.dspFlg);
      setRows(data);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Box>
      {/*貸出状況検索*/}
      <Paper variant="outlined">
        <Grid2 container spacing={2} alignItems="center" px={2}>
          <Typography>貸出状況</Typography>
          <Typography>機材検索</Typography>
        </Grid2>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} p={2} spacing={2}>
            <Grid2 container display={'flex'} alignItems={'center'}>
              <Typography>受注機材名キーワード</Typography>
              <TextFieldElement name="query" control={control} />
            </Grid2>
            <Button type="submit" loading={isLoading}>
              <SearchIcon fontSize="small" />
              検索
            </Button>
          </Grid2>
        </form>
      </Paper>
      <Paper variant="outlined" sx={{ pt: 2, mt: 2 }}>
        <Box pl={2}>
          <MuiTablePagination arrayList={rows} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Box>
        {isLoading ? (
          <Loading />
        ) : !rows || rows!.length === 0 ? (
          <Typography ml={2}>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} sx={{ maxHeight: '80vh', mt: 1 }} square>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow sx={{ whiteSpace: 'nowrap' }}>
                  <TableCell padding="checkbox" style={styles.style}></TableCell>
                  <TableCell align="left" style={styles.style}>
                    機材名
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    所属
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    保有数
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    NG数
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    部門
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    大部門
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    集計部門
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    定価
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    メモ
                  </TableCell>
                  {/* <TableCell /> */}
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((loan, index) => (
                  <TableRow key={loan.kizaiId} sx={{ whiteSpace: 'nowrap' }}>
                    <TableCell align="center" padding="none">
                      {index + 1}
                    </TableCell>
                    <TableCell align="left" style={styles.style}>
                      <Button
                        variant="text"
                        onClick={() => window.open(`/loan-situation/${loan.kizaiId}`)}
                        sx={{ justifyContent: 'start', p: 0, textTransform: 'none' }}
                      >
                        {loan.kizaiNam}
                      </Button>
                    </TableCell>
                    <TableCell align="left" style={styles.style}>
                      {loan.shozokuNam === 'KICS' ? 'K' : loan.shozokuNam === 'YARD' ? 'Y' : 'その他'}
                    </TableCell>
                    <TableCell align="right" style={styles.style}>
                      {loan.kizaiQty}
                    </TableCell>
                    <TableCell align="right" style={styles.style}>
                      {loan.kizaiNgQty}
                    </TableCell>
                    <TableCell align="left" style={styles.style}>
                      {loan.bumonNam}
                    </TableCell>
                    <TableCell align="left" style={styles.style}>
                      {loan.daibumonNam}
                    </TableCell>
                    <TableCell align="left" style={styles.style}>
                      {loan.shukeibumonNam}
                    </TableCell>
                    <TableCell align="right" style={styles.style}>
                      {loan.regAmt}
                    </TableCell>
                    <TableCell align="left" style={styles.style}>
                      <LightTooltipWithText variant={'body2'} maxWidth={280}>
                        {loan.mem}
                      </LightTooltipWithText>
                    </TableCell>
                    {/* <TableCell>
                  <Box display={'flex'}>
                    <IconButton onClick={() => moveRow(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => moveRow(index, 1)} disabled={index === datas.length - 1}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  style: {
    paddingTop: 0,
    paddingBottom: 0,
  },
};
