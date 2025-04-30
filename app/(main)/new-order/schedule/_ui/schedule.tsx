'use client';

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import GridTable from '@/app/(main)/_ui/gridtable';
import {
  dateData,
  dateHeader,
  dateWidths,
  equipmentData,
  equipmentHeader,
  equipmentWidths,
} from '@/app/(main)/new-order/schedule/_lib/data';

const Schedule = () => {
  const [equipmentRows, setEquipmentRows] = useState(equipmentData);
  const [testRows, setTestRows] = useState(dateData);
  const editableColumns = [2, 3];

  const equipmentCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].data[colIndex] = newValue;
    setEquipmentRows(updatedRows);
    console.log(`Row ${rowIndex}, Column ${colIndex} changed to "${newValue}"`);
  };

  return (
    <Box width="100%" bgcolor={grey[300]}>
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor={grey[400]}>
        <Typography margin={1}>受注機材・スケジュール</Typography>
        <Button variant="contained" href="/new-order">
          戻る
        </Button>
      </Box>
      <Box sx={styles.container}>
        <Typography marginRight={4}>受注番号</Typography>
        <TextField disabled></TextField>
        <Typography marginLeft={6} marginRight={4}>
          受注ステータス
        </Typography>
        <TextField disabled defaultValue={'確定'}></TextField>
      </Box>
      <Box sx={styles.container}>
        <Typography marginRight={6}>公演名</Typography>
        <TextField disabled defaultValue={'XXXXXXXX'}></TextField>
        <Typography marginLeft={6} marginRight={4}>
          公演場所
        </Typography>
        <TextField disabled defaultValue={'XXXXXXXX'}></TextField>
        <Typography marginLeft={6} marginRight={4}>
          顧客名
        </Typography>
        <TextField disabled defaultValue={'XXXXXXXX'}></TextField>
      </Box>
      <Box sx={styles.container}>
        <Button>＜＜</Button>
        <Button sx={{ bgcolor: 'white', color: 'black' }}>日付選択</Button>
        <Button>＞＞</Button>
      </Box>
      <Box display="flex" flexDirection="row" width="90%">
        <Box width="40%">
          <GridTable
            header={equipmentHeader}
            rows={equipmentRows}
            editableColumns={editableColumns}
            onChange={equipmentCellChange}
            cellWidths={equipmentWidths}
          />
        </Box>
        <Box width="60%">
          <GridTable
            header={dateHeader}
            rows={testRows}
            editableColumns={null}
            onChange={equipmentCellChange}
            cellWidths={dateWidths}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default Schedule;

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 1,
    marginLeft: 2,
  },
};
