'use client';

import { Box, Button, Divider, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { Calendar } from '../../_ui/date';
import GridTable from '../../_ui/gridtable';
import {
  getDateHeaderBackgroundColor,
  getDateTextColor,
  getEquipmentHeaderBackgroundColor,
  getEquipmentRowBackgroundColor,
  getEquipmentTextColor,
} from '../../new-order/schedule/_lib/colorselect';
import { getBackgroundColor } from '../_lib/colorselect';
import { dateData, dateHeader, dateWidths, equipmentData, equipmentHeader, equipmentWidths } from '../_lib/data';

export const Stock = () => {
  const [equipmentRows, setEquipmentRows] = useState(equipmentData);
  const [dateRows, setTestRows] = useState(dateData);
  const [visible, setVisible] = useState(false);
  const editableColumns = [2, 3];

  const equipmentCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].data[colIndex] = newValue;
    setEquipmentRows(updatedRows);
    console.log(`Row ${rowIndex}, Column ${colIndex} changed to "${newValue}"`);
  };

  return (
    <Paper>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography margin={1}>在庫確認</Typography>
        <Button sx={{ margin: 2 }}>検索</Button>
      </Box>
      <Divider />
      <Box>
        <Box display="flex" alignItems="center" p={2}>
          <Typography mr={2}>部門</Typography>
          <TextField defaultValue="SHARPY Plus"></TextField>
        </Box>
        <Box marginTop={2} display="flex" justifyContent="center">
          <Button>＜＜</Button>
          <Box>
            <Button sx={{ bgcolor: 'white', color: 'black' }} onClick={() => setVisible(true)}>
              日付選択
            </Button>
            <Box position="absolute" zIndex={1000} display={visible ? 'block' : 'none'}>
              <Calendar />
              <Box display="flex" justifyContent="space-between">
                <Button onClick={() => setVisible(false)} sx={{ margin: 1 }}>
                  キャンセル
                </Button>
                <Button onClick={() => setVisible(false)} sx={{ margin: 1 }}>
                  確定
                </Button>
              </Box>
            </Box>
          </Box>
          <Button>＞＞</Button>
        </Box>
        <Box display="flex" flexDirection="row" width="100%" marginTop={2}>
          <Box width="30%">
            <GridTable
              header={equipmentHeader}
              rows={equipmentRows}
              editableColumns={editableColumns}
              onChange={equipmentCellChange}
              cellWidths={equipmentWidths}
              headerColorSelect={true}
              getHeaderBackgroundColor={getEquipmentHeaderBackgroundColor}
              getHeaderTextColor={getEquipmentTextColor}
              rowColorSelect={true}
              getRowBackgroundColor={getEquipmentRowBackgroundColor}
            />
          </Box>
          <Box width="70%">
            <GridTable
              header={dateHeader}
              rows={dateRows}
              editableColumns={null}
              onChange={equipmentCellChange}
              cellWidths={dateWidths}
              headerColorSelect={true}
              getHeaderBackgroundColor={getDateHeaderBackgroundColor}
              getHeaderTextColor={getDateTextColor}
              rowColorSelect={true}
              getRowBackgroundColor={getBackgroundColor}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};
