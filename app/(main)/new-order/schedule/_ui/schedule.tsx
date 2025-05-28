'use client';

import { Box, Button, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { Calendar } from '@/app/(main)/_ui/date';
import GridTable from '@/app/(main)/_ui/gridtable';
import {
  getDateHeaderBackgroundColor,
  getDateRowBackgroundColor,
  getDateTextColor,
  getEquipmentHeaderBackgroundColor,
  getEquipmentRowBackgroundColor,
  getEquipmentTextColor,
} from '@/app/(main)/new-order/schedule/_lib/colorselect';
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
  const [visible, setVisible] = useState(false);
  const editableColumns = [2, 3];

  const equipmentCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].data[colIndex] = newValue;
    setEquipmentRows(updatedRows);
    console.log(`Row ${rowIndex}, Column ${colIndex} changed to "${newValue}"`);
  };

  return (
    <Box width="100%" bgcolor={grey[300]}>
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor={grey[400]}>
        <Typography margin={1}>受注機材・スケジュール</Typography>
        <Button href="/new-order">戻る</Button>
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
      <Box display="flex" justifyContent="center" alignItems="center" margin={2}>
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
        <Button sx={{ marginLeft: 10 }}>編集</Button>
        <Button sx={{ marginLeft: 10 }}>確定</Button>
      </Box>
      <Box display="flex" flexDirection="row" width="100%">
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
            rows={testRows}
            editableColumns={null}
            onChange={equipmentCellChange}
            cellWidths={dateWidths}
            headerColorSelect={true}
            getHeaderBackgroundColor={getDateHeaderBackgroundColor}
            getHeaderTextColor={getDateTextColor}
            rowColorSelect={true}
            getRowBackgroundColor={getDateRowBackgroundColor}
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
