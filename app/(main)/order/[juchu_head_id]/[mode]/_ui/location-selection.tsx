'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Dialog,
  Divider,
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
import { grey } from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import { GetFilteredLocs } from '@/app/(main)/(masters)/locations-master/_lib/funcs';
import {
  LocsMasterSearchSchema,
  LocsMasterSearchValues,
  LocsMasterTableValues,
} from '@/app/(main)/(masters)/locations-master/_lib/types';

import { MuiTablePagination } from '../../../../_ui/table-pagination';
//import { locationList } from '../../../../(masters)/locations-master/_lib/datas';

/** 新規受注の場所選択ダイアログ */
export const LocationSelectDialog = (props: {
  handleLocSelect: (locNam: string) => void;
  handleCloseLocationDialog: () => void;
}) => {
  const { handleLocSelect, handleCloseLocationDialog } = props;
  /* useState ------------------ */
  const [locs, setLocs] = useState<LocsMasterTableValues[]>();
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 && locs ? locs.slice((page - 1) * rowsPerPage, page * rowsPerPage) : locs),
    [locs, page]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 && locs ? Math.max(0, page * rowsPerPage - locs.length) : 0;

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
    resolver: zodResolver(LocsMasterSearchSchema),
  });

  const onSubmit = async (data: LocsMasterSearchValues) => {
    setIsLoading(true);
    const newList = await GetFilteredLocs(data.query!);
    setLocs(newList);
    setIsLoading(false);
  };

  useEffect(() => {
    // ダイアログが開いた瞬間（ここで最新をとる）
    const getLocs = async () => {
      setIsLoading(true);
      const data = await GetFilteredLocs('');
      setLocs(data);
      setIsLoading(false);
    };

    getLocs();
  }, []);

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>公演場所選択</Typography>
            <Button onClick={() => handleCloseLocationDialog()}>戻る</Button>
          </Box>
          <Divider />
          <Box width={'100%'} p={2}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
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
          </Box>
        </Paper>
        {/*  ---------- ↑検索 ↓場所テーブル-------------- */}
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {list!.map((location) => (
                      <TableRow key={location.locId}>
                        <TableCell>
                          <Button variant="text" onClick={() => handleLocSelect(location.locNam)}>
                            {location.locNam}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {location.adrShozai} {location.adrTatemono} {location.adrSonota}
                        </TableCell>
                        <TableCell>{location.tel}</TableCell>
                        <TableCell>{location.fax}</TableCell>
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
