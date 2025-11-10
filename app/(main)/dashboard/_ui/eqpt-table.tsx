'use client';

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

import { LoanEqTableValues } from '../../loan-situation/_lib/types';

/**
 * 機材テーブル
 */
export const EqptTable = ({ eqpts }: { eqpts: LoanEqTableValues[] }) => {
  // データがない場合の表示
  if (!eqpts || eqpts.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
        該当する機材はありません
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300, mt: 1 }}>
      <Table stickyHeader size="small" aria-label="eqpt table">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell>機材名</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {eqpts.map((eqpt) => (
            <TableRow key={eqpt.kizaiId} hover>
              <TableCell>
                <Button
                  variant="text"
                  color="primary"
                  size="small"
                  sx={{
                    p: 0,
                    minWidth: 'auto',
                    textAlign: 'left',
                    justifyContent: 'flex-start',
                    fontWeight: 'normal',
                    '&:hover': {
                      textDecoration: 'underline',
                      backgroundColor: 'transparent', // ホバー時の背景色を無効化
                    },
                  }}
                  onClick={() => window.open(`/loan-situation/${eqpt.kizaiId}`, '_blank')}
                >
                  {eqpt.kizaiNam}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
