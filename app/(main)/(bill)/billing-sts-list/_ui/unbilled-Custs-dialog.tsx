'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Checkbox,
  Container,
  DialogActions,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ChangeEvent, useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';

import { getUnbilledCusts } from '../_lib/funcs';

export const UnbilledCustsDialog = (props: {
  unbilledCusts: string[];
  handleConfirmed: (selectedCusts: string[]) => void;
  onClose: () => void;
}) => {
  const { unbilledCusts, handleConfirmed, onClose } = props;

  const [isLoading, setIsLoading] = useState(true);

  const [custs, setCusts] = useState<string[]>([]);

  const [selectCusts, setSelectCusts] = useState<string[]>(unbilledCusts ?? []);
  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  console.log('unbilledCusts:', unbilledCusts);

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* 検索ボタン押下 */
  const onSubmit = async (data: { query: string }) => {
    setIsLoading(true);

    try {
      const newList = await getUnbilledCusts(data.query!);
      newList.sort((a, b) => {
        const aSelected = selectCusts.includes(a);
        const bselected = selectCusts.includes(b);
        if (aSelected && !bselected) return -1;
        if (!aSelected && bselected) return 1;
        return 0;
      });
      setCusts(newList);
    } catch (e) {
      setSnackBarMessage('顧客情報の取得に失敗しました');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
  };

  const handleSelect = (customer: string) => {
    const newSelected = selectCusts.includes(customer)
      ? selectCusts.filter((item) => item !== customer)
      : [...selectCusts, customer];
    setSelectCusts(newSelected);
  };

  const handleAllSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const newSelected = e.target.checked && custs ? custs.map((c) => c) : [];
    setSelectCusts(newSelected);
  };

  useEffect(() => {
    // ダイアログが開いた瞬間に fetch（ここで最新をとる）
    const getCusts = async () => {
      setIsLoading(true);
      try {
        const data = await getUnbilledCusts('');
        data.sort((a, b) => {
          const aSelected = selectCusts.includes(a);
          const bselected = selectCusts.includes(b);
          if (aSelected && !bselected) return -1;
          if (!aSelected && bselected) return 1;
          return 0;
        });
        //setSelectCusts(selectedCusts);
        setCusts(data);
      } catch (e) {
        setSnackBarMessage('顧客情報の取得に失敗しました');
        setSnackBarOpen(true);
      }
      setIsLoading(false);
    };

    getCusts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} px={2} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>未請求顧客選択</Typography>
          </Box>
          <Divider />
          <Box width={'100%'} p={2}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} alignItems={'center'}>
                <Stack alignItems={'center'}>
                  <Typography>キーワード</Typography>
                  <TextFieldElement name="query" control={control} />
                </Stack>
                <Button type="submit" loading={isLoading}>
                  <SearchIcon />
                  検索
                </Button>
              </Stack>
            </form>
            <Typography></Typography>
          </Box>
        </Paper>
        {isLoading ? (
          <Loading />
        ) : custs.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '60vh', mt: 1 }}>
            <Table stickyHeader padding="none">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={custs && selectCusts.length > 0 && selectCusts.length < custs.length}
                      checked={custs && custs.length > 0 && selectCusts.length === custs.length}
                      onChange={(e) => handleAllSelect(e)}
                    />
                  </TableCell>
                  <TableCell>顧客名</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {custs.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selectCusts.includes(customer)} onChange={() => handleSelect(customer)} />
                    </TableCell>
                    <TableCell>{customer}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Box display={'flex'} justifyContent={'end'} mt={2}>
          <Grid2 container spacing={2}>
            <Button type="submit" onClick={() => handleConfirmed(selectCusts)}>
              確定
            </Button>
            <Button onClick={onClose}>キャンセル</Button>
          </Grid2>
        </Box>
      </Container>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </>
  );
};
