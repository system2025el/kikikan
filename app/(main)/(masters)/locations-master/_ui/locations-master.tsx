'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { JSX, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '../../../_ui/buttons';
import { GetFilteredLocs } from '../_lib/funcs';
import { LocsMasterSearchSchema, LocsMasterSearchValues, LocsMasterTableValues } from '../_lib/types';
import { LocationsMasterTable } from './locations-master-table';

/**
 * 公演場所マスタ画面
 * @returns {JSX.Element} 公演場所マスタ画面コンポーネント
 */
export const LocationsMaster = ({ locs }: { locs: LocsMasterTableValues[] | undefined }) => {
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
    const newList = await GetFilteredLocs(data.query!);
    setTheLocs(newList);
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
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
                <Stack alignItems={'center'} mt={1}>
                  <Typography noWrap width={100}>
                    キーワード
                  </Typography>
                  <TextFieldElement name="query" control={control} />
                  <Typography noWrap variant="body2">
                    場所、住所、Tel、Faxから検索
                  </Typography>
                </Stack>
                <Box>
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Box>
              </Stack>
            </form>
          </Box>
        </Paper>
        <LocationsMasterTable locs={theLocs} isLoading={isLoading} setIsLoading={setIsLoading} />
      </Container>
    </>
  );
};
