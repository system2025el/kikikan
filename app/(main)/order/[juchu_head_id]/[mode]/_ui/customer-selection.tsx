'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid2,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import {
  CustomersMasterTableValues,
  // CustomersMasterSearchSchema,
  // CustomersMasterSearchValues,
} from '@/app/(main)/(masters)/customers-master/_lib/types';

import { MuiTablePagination } from '../../../../_ui/table-pagination';
//import { customers } from '../../../../(masters)/customers-master/_lib/datas';
import { GetFilteredCustomers } from '../_lib/funcs';
import { KokyakuValues } from '../_lib/types';

/** 新規受注の相手選択ダイアログ（全画面） */
export const CustomerSelectionDialog = (props: {
  handleCustSelect: (customer: KokyakuValues) => void;
  handleCloseCustDialog: () => void;
}) => {
  const { handleCustSelect, handleCloseCustDialog } = props;
  const [custs, setCusts] = useState<CustomersMasterTableValues[]>();
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 && custs ? custs.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : custs),
    [custs, page]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 && custs ? Math.max(0, page * rowsPerPage - custs.length) : 0;

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    const newList = await GetFilteredCustomers(data.query!);
    setCusts(newList);
    setIsLoading(false);
  };

  useEffect(() => {
    // ダイアログが開いた瞬間に fetch（ここで最新をとる）
    const getCusts = async () => {
      setIsLoading(true);
      const data = await GetFilteredCustomers('');
      setCusts(data);
      setIsLoading(false);
    };

    getCusts();
  }, []);

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>相手選択</Typography>
            <Button onClick={() => handleCloseCustDialog()}>戻る</Button>
          </Box>
          <Divider />
          <Box width={'100%'} p={2}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} mt={1}>
                <Stack alignItems={'baseline'}>
                  <Typography>キーワード</Typography>
                  <TextFieldElement name="query" control={control} helperText={'場所、住所、Tel、Faxから検索'} />
                </Stack>
                <Box alignSelf={'end'}>
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Box>
              </Stack>
            </form>
            <Typography></Typography>
          </Box>
        </Paper>
        {/* ↑検索 ↓テーブル */}
        <Stack mt={1} mx={0.5} justifyContent={'space-between'}>
          <MuiTablePagination arrayList={list ? list : []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Stack>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {list!.length < 1 && <Typography>該当するデータがありません</Typography>}
            {list!.length > 0 && (
              <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
                <Table stickyHeader padding="none">
                  <TableHead>
                    <TableRow>
                      <TableCell>場所</TableCell>
                      <TableCell>住所</TableCell>
                      <TableCell>TEL</TableCell>
                      <TableCell>FAX</TableCell>
                      <TableCell>メモ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {list!.map((customer) => (
                      <TableRow key={customer.kokyakuId}>
                        <TableCell>
                          <Button
                            variant="text"
                            onClick={() =>
                              handleCustSelect({ kokyakuId: customer.kokyakuId, kokyakuNam: customer.kokyakuNam })
                            }
                          >
                            {customer.kokyakuNam}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {customer.adrShozai} {customer.adrTatemono}
                        </TableCell>
                        <TableCell>{customer.tel}</TableCell>
                        <TableCell>{customer.fax}</TableCell>
                        <TableCell sx={{ maxWidth: 20 }}>
                          <Typography noWrap>{customer.mem}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {emptyRows > 0 && (
                      <TableRow style={{ height: 30 * emptyRows }}>
                        <TableCell colSpan={8} />
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Container>
    </>
  );
};
