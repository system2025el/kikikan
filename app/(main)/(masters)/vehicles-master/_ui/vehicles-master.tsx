'use client';
import { Box, Container, Paper, Typography } from '@mui/material';
import { useState } from 'react';

import { VehsMasterTableValues } from '../_lib/types';
import { VehiclesMasterTable } from './vehicles-master-table';
/**
 * 車両マスタ画面
 * @param vehs DBからとってきた車両リスト
 * @returns {JSX.Element} 車両マスタ画面コンポーネント
 */
export const VehiclesMaster = ({ vehs }: { vehs: VehsMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  /** 表示する車両の配列 */
  const [theVehs, setTheVehs] = useState(vehs);
  /** 表示してるページ */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);

  // 車両マスタに検索自体必要なのか？
  // /* useForm ------------------- */
  // const { control, handleSubmit } = useForm({
  //   mode: 'onSubmit',
  //   defaultValues: { query: '' },
  // });

  // /* 検索ボタン押下 */
  // const onSubmit = async (data: { query: string | undefined }) => {
  //   setIsLoading(true);
  //   console.log('data : ', data);
  //   // const newList = await getFilteredVehs(data.query!);
  //   // setTheVehs(newList);
  //   console.log('theVehs : ', theVehs);
  // };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>車両マスタ検索</Typography>
        </Box>
      </Paper>
      <VehiclesMasterTable
        vehs={theVehs}
        page={page}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
