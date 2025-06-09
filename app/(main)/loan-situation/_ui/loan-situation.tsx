'use client';

import {
  Box,
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { Calendar } from '../../_ui/date';
import GridTable from '../../_ui/gridtable';
import {
  getDateHeaderBackgroundColor,
  getDateHeaderTextColor,
  getDateRowBackgroundColor,
  getLoanHeaderBackgroundColor,
  getLoanRowBackgroundColor,
  getLoanTextColor,
} from '../_lib/colorselect';
import { dateData, dateHeader, dateWidth, loanData, loanHeader, loanWidth } from '../_lib/data';

export const LoanSituation = () => {
  const [visible, setVisible] = useState(false);

  return (
    <Paper variant="outlined">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography margin={1}>貸出状況</Typography>
        <Button sx={{ margin: 1 }}>戻る</Button>
      </Box>
      <Divider />
      <Box sx={styles.container}>
        <Typography marginRight={2}>機材名</Typography>
        <TextField disabled defaultValue="SHARPY PLUS"></TextField>
      </Box>
      <Box sx={styles.container}>
        <Typography marginRight={2}>保有数</Typography>
        <TextField
          disabled
          defaultValue="200"
          sx={{
            '& .MuiInputBase-input': {
              textAlign: 'right',
            },
          }}
        ></TextField>
        <Typography marginRight={2} marginLeft={10}>
          定価
        </Typography>
        <TextField
          disabled
          defaultValue="20,000円"
          sx={{
            '& .MuiInputBase-input': {
              textAlign: 'right',
            },
          }}
        ></TextField>
        <FormControl sx={{ marginLeft: 10 }}>
          <RadioGroup defaultValue="出庫日順">
            <FormControlLabel value="出庫日順" control={<Radio />} label="出庫日順" />
            <FormControlLabel value="入庫日順" control={<Radio />} label="入庫日順" />
          </RadioGroup>
        </FormControl>
      </Box>
      <Box sx={styles.container} justifyContent="center">
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
      <Box display="flex" flexDirection="row" width="100%">
        <Box width="30%">
          <GridTable
            header={loanHeader}
            rows={loanData}
            editableColumns={null}
            onChange={undefined}
            cellWidths={loanWidth}
            headerColorSelect={true}
            getHeaderBackgroundColor={getLoanHeaderBackgroundColor}
            getHeaderTextColor={getLoanTextColor}
            rowColorSelect={true}
            getRowBackgroundColor={getLoanRowBackgroundColor}
          />
        </Box>
        <Box width="70%">
          <GridTable
            header={dateHeader}
            rows={dateData}
            editableColumns={null}
            onChange={undefined}
            cellWidths={dateWidth}
            headerColorSelect={true}
            getHeaderBackgroundColor={getDateHeaderBackgroundColor}
            getHeaderTextColor={getDateHeaderTextColor}
            rowColorSelect={true}
            getRowBackgroundColor={getDateRowBackgroundColor}
          />
        </Box>
      </Box>
    </Paper>
  );
};

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
