'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, FormControl, Grid2, Paper, Select, Stack, Typography } from '@mui/material';
import { SetStateAction, useState } from 'react';
import { SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '../../../_ui/buttons';
import { eqptMasterList } from '../_lib/datas';
import { EqptMasterDialogValues, EqptMasterTableValues } from '../_lib/types';
import { EqptMasterTable } from './eqpt-master-table';

export const EqptMaster = ({ eqpts }: { eqpts: EqptMasterTableValues[] | undefined }) => {
  // useState
  const [displayList, setDisplayList] = useState<EqptMasterTableValues[] | undefined>(eqpts);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  // 検索useForm--------------------------
  const { control, handleSubmit } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',

    defaultValues: { query: '', bumonQuery: '', daibumonQuery: '', shukeiQuery: '' },
  });

  const onSubmit = (data: {
    query: string | undefined;
    bumonQuery: string | undefined;
    daibumonQuery: string | undefined;
    shukeiQuery: string | undefined;
  }) => {
    if (data.query === '') {
      setDisplayList([...eqptMasterList]);
    } else {
      const list = eqptMasterList.filter((c) => c.kizaiNam.includes(data.query!.trim()));
      setDisplayList(list);
      console.log(data);
    }
  };
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>機材マスタ一覧</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack>
                <Typography noWrap>機材名キーワード</Typography>
                <TextFieldElement name={'query'} control={control} />
              </Stack>
            </Stack>
            <Grid2 container justifyContent={'space-between'} alignItems={'start'} mt={1} spacing={1}>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Typography width={100}>部門</Typography>
                <SelectElement name="bumonQuery" control={control} sx={{ minWidth: '60%' }} />
              </Grid2>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Typography width={100}>大部門</Typography>
                <SelectElement name="daibumonQuery" control={control} sx={{ minWidth: '60%' }} />
              </Grid2>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Typography width={100}>集計部門</Typography>
                <SelectElement name="shukeiQuery" control={control} sx={{ minWidth: '60%' }} />
              </Grid2>
            </Grid2>
            <Box mt={1} alignSelf={'end'} justifySelf={'end'}>
              <Button type="submit">
                <SearchIcon />
                検索
              </Button>
            </Box>
          </form>
          <Typography></Typography>
        </Box>
      </Paper>
      <EqptMasterTable eqpts={displayList} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
