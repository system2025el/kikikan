'use client';

import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey, yellow } from '@mui/material/colors';
import { useRouter } from 'next/navigation';

export const IdoListTable = (/*props: {data: }*/) => {
  const router = useRouter();
  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '70vw' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="left" sx={{ bgcolor: grey[400] }}>
              移動指示
            </TableCell>
            <TableCell align="left">出庫ステータス</TableCell>
            <TableCell align="left">出発ステータス</TableCell>
            <TableCell sx={{ bgcolor: grey[400] }}></TableCell>
            <TableCell align="left" sx={{ bgcolor: yellow[300], color: 'black' }}>
              入庫ステータス
            </TableCell>
            <TableCell align="left" sx={{ bgcolor: yellow[300], color: 'black' }}>
              到着ステータス
            </TableCell>
            <TableCell sx={{ bgcolor: grey[400] }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell align="left">YARD→KICS</TableCell>
            <TableCell align="left">〇</TableCell>
            <TableCell align="left">〇</TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push('ido-list/ido-detail/1/40')}>詳細</Button>
            </TableCell>
            <TableCell align="left">△</TableCell>
            <TableCell align="left">ー</TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push('ido-list/ido-detail/1/50')}>詳細</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">KICS→YARD</TableCell>
            <TableCell align="left">無し</TableCell>
            <TableCell align="left">無し</TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push('ido-list/ido-detail/1/40')}>詳細</Button>
            </TableCell>
            <TableCell align="left">無し</TableCell>
            <TableCell align="left">無し</TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push('ido-list/ido-detail/1/50')}>詳細</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
