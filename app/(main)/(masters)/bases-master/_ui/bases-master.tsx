'use client';
import { Box, Container, Paper, Typography } from '@mui/material';
import { SetStateAction, useState } from 'react';

import { BackButton } from '../../../_ui/buttons';
import { BasesMasterTableValues } from '../_lib/types';
import { BasesMasterTable } from './bases-master-table';

/**
 * 拠点マスタ
 * @param {bases} 拠点リスト配列
 * @returns {JSX.Element} 拠点マスタコンポーネント
 */
export const BasesMaster = ({ bases }: { bases: BasesMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theBases, setTheBases] = useState(bases);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>拠点マスタ検索</Typography>
        </Box>
      </Paper>
      <BasesMasterTable
        bases={theBases}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        page={page}
        setPage={setPage}
      />
    </Container>
  );
};
