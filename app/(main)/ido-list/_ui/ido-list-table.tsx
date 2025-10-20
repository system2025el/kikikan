'use client';

import { Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey, yellow } from '@mui/material/colors';
import { useRouter } from 'next/navigation';

import { IdoTableValues } from '../_lib/types';

export const IdoListTable = (props: { datas: IdoTableValues[] }) => {
  const router = useRouter();

  const { datas } = props;
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
            <TableCell align="left">{datas[0].nchkSagyoStsNamShort}</TableCell>
            <TableCell align="left">
              {datas[0].shukoFixFlg === 1 ? '〇' : datas[0].shukoFixFlg === 0 ? 'ー' : '無し'}
            </TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push(`ido-list/ido-detail/40/${datas[0].nyushukoDat}/2/2`)}>詳細</Button>
            </TableCell>
            <TableCell align="left">{datas[0].schkSagyoStsNamShort}</TableCell>
            <TableCell align="left">
              {datas[0].nyukoFixFlg === 1 ? '〇' : datas[0].nyukoFixFlg === 0 ? 'ー' : '無し'}
            </TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push(`ido-list/ido-detail/50${datas[0].nyushukoDat}/2/1`)}>詳細</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell align="left">KICS→YARD</TableCell>
            <TableCell align="left">{datas[1].nchkSagyoStsNamShort}</TableCell>
            <TableCell align="left">
              {datas[1].shukoFixFlg === 1 ? '〇' : datas[1].shukoFixFlg === 0 ? 'ー' : '無し'}
            </TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push(`ido-list/ido-detail/40/${datas[1].nyushukoDat}/1/1`)}>詳細</Button>
            </TableCell>
            <TableCell align="left">{datas[1].schkSagyoStsNamShort}</TableCell>
            <TableCell align="left">
              {datas[1].nyukoFixFlg === 1 ? '〇' : datas[1].nyukoFixFlg === 0 ? 'ー' : '無し'}
            </TableCell>
            <TableCell align="center">
              <Button onClick={() => router.push(`ido-list/ido-detail/50/${datas[1].nyushukoDat}/1/2`)}>詳細</Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
