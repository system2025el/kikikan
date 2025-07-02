'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Stack,
  TableContainer,
  TextField,
  Typography,
} from '@mui/material';
import { JSX, SetStateAction, useEffect, useMemo, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import { MasterTable } from '@/app/(main)/_ui/table';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { BackButton } from '../../../_ui/buttons';
//DB import { GetFilteredLocs } from '../_lib/funcs';
import { lMHeader, LocMasterTableValues, LocsMasterSearchSchema, LocsMasterSearchValues } from '../_lib/types';
import page from '../page';
import { LocationsMasterDialog } from './locations-master-dialog';
import { LocationsMasterTable } from './locations-master-table';

/**
 * 公演場所マスタ画面
 * @returns {JSX.Element} 公演場所マスタ画面コンポーネント
 */
export const LocationsMaster = ({ locs }: { locs: LocMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theLocs, setTheLocs] = useState(locs);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
    resolver: zodResolver(LocsMasterSearchSchema),
  });

  const onSubmit = async (data: LocsMasterSearchValues) => {
    setIsLoading(true);
    console.log('data : ', data, 'locs : ', locs);
    //DB const newList = await GetFilteredLocs(data.query!);
    // setTheLocs(newList);
    console.log('theLocs : ', theLocs);
  };

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        <Box justifySelf={'end'} mb={0.5}>
          <BackButton label={'戻る'} />
        </Box>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} p={2}>
            <Typography>公演場所マスタ検索</Typography>
          </Box>
          <Divider />
          <Box width={'100%'} p={2}>
            <Stack>
              <Typography variant="body2">検索</Typography>
            </Stack>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
                <Stack alignItems={'center'}>
                  <Typography noWrap width={100}>
                    地域
                  </Typography>
                  <TextField />
                  <Button>選択</Button>
                </Stack>
                <Box>
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Box>
              </Stack>
              <Stack alignItems={'center'} mt={1}>
                <Typography noWrap width={100}>
                  キーワード
                </Typography>
                <TextFieldElement name="query" control={control} />
                <Typography noWrap variant="body2">
                  場所、住所、Tel、Faxから検索
                </Typography>
              </Stack>
            </form>
          </Box>
        </Paper>
        <LocationsMasterTable locs={theLocs} isLoading={isLoading} setIsLoading={setIsLoading} />
      </Container>
    </>
  );
};
