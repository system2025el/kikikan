'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, FormControl, Grid2, Paper, Select, Stack, Typography } from '@mui/material';
import { SetStateAction, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '../../../_ui/buttons';
import { eqptMasterList } from '../_lib/datas';
import {
  EqptMasterDialogValues,
  EqptMasterSearchSchema,
  EqptMasterSearchValues,
  EqptMasterTableValues,
} from '../_lib/types';
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
    resolver: zodResolver(EqptMasterSearchSchema),
    defaultValues: {},
  });
  const onSubmit = (data: EqptMasterSearchValues) => {
    if (data.kizaiNam === '') {
      setDisplayList([...eqptMasterList]);
    } else {
      const list = eqptMasterList.filter((c) => c.kizaiNam.includes(data.kizaiNam.trim()));
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
          <Stack justifyContent={'space-between'}>
            <Typography variant="body2">検索</Typography>
          </Stack>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack>
                <Typography noWrap id="name">
                  機材名キーワード
                </Typography>
                <Box>
                  <TextFieldElement name={'kizaiNam'} control={control} color="primary"></TextFieldElement>
                </Box>
              </Stack>
              <Box>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
            <Grid2 container justifyContent={'space-between'} alignItems={'start'} mt={1} spacing={1}>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Box width={100} mr={1}>
                  <Typography>部門</Typography>
                </Box>
                <FormControl sx={{ minWidth: '60%' }}>
                  <Select labelId="search" label="検索条件"></Select>
                </FormControl>
                {/* <SelectElement name='bumon' control={control}></SelectElement> */}
              </Grid2>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Box width={100} mr={1}>
                  <Typography>大部門</Typography>
                </Box>
                <FormControl sx={{ minWidth: '60%' }}>
                  <Select labelId="search" label="検索条件"></Select>
                </FormControl>
              </Grid2>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Box width={100} mr={1}>
                  <Typography>集計部門</Typography>
                </Box>
                <FormControl sx={{ minWidth: '60%' }}>
                  <Select labelId="search" label="検索条件"></Select>
                </FormControl>
              </Grid2>
            </Grid2>
          </form>
          <Typography></Typography>
        </Box>
      </Paper>
      <EqptMasterTable eqpts={displayList} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
