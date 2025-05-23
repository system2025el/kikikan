'use client';

import { Box, Button, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
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

  const equipmentCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].data[colIndex] = newValue;
    setEquipmentRows(updatedRows);
    console.log(`Row ${rowIndex}, Column ${colIndex} changed to "${newValue}"`);
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor={grey[300]}>
        <Typography margin={1}>在庫確認</Typography>
        <Button sx={{ margin: 2 }}>検索</Button>
      </Box>
      <Box bgcolor={grey[200]}>
        <Box display="flex" alignItems="center">
          <Typography margin={1}>機材名</Typography>
          <TextField defaultValue="SHARPY Plus" sx={{ ml: 4 }}></TextField>
        </Box>
        <Box marginTop={6} display="flex" justifyContent="center">
          <Button>＜＜</Button>
          <Box>
            <Button sx={{ bgcolor: 'white', color: 'black' }} onClick={() => setVisible(true)}>
              日付選択
            </Button>
            <Box position="absolute" bgcolor={grey[200]} zIndex={1000} display={visible ? 'block' : 'none'}>
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
          <Box width="35%">
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
          <Box width="65%">
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
    </>
  );
};
