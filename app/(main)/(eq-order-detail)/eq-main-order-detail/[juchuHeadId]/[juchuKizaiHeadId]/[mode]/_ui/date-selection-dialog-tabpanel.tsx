'use client';

import { Button, Grid2, TextField, Typography } from '@mui/material';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

import { JuchuKizaiHonbanbiValues } from '../_lib/types';

type TabPanelUIProps = {
  JuchuKizaiHonbanbiData: JuchuKizaiHonbanbiValues[];
  handleAddChange: (index: number, value: number) => void;
  handleMemChange: (index: number, value: string) => void;
  handleRemove: (index: number) => void;
};

export const TabPanelUI = ({
  JuchuKizaiHonbanbiData,
  handleAddChange,
  handleMemChange,
  handleRemove,
}: TabPanelUIProps) => {
  return (
    <>
      <Grid2 container display="flex" flexDirection="row" spacing={2} ml={2} width={{ md: '50%' }}>
        <Grid2 size={3} maxWidth={120}>
          <Typography>日付</Typography>
        </Grid2>
        <Grid2 size={3} maxWidth={100}>
          <Typography>追加日数</Typography>
        </Grid2>
        <Grid2 size={5} maxWidth={250}>
          <Typography>メモ</Typography>
        </Grid2>
      </Grid2>
      {JuchuKizaiHonbanbiData.map((data, index) => (
        <Grid2
          key={index}
          container
          display="flex"
          flexDirection="row"
          alignItems={'center'}
          spacing={2}
          ml={2}
          py={1}
          width={{ md: '50%' }}
        >
          <Grid2 size={3} maxWidth={120}>
            <Typography>{toJapanYMDString(data.juchuHonbanbiDat)}</Typography>
          </Grid2>
          <Grid2 size={3} display={'flex'} alignItems={'center'} maxWidth={100}>
            <TextField
              value={data.juchuHonbanbiAddQty ?? 0}
              onChange={(e) => handleAddChange(index, Number(e.target.value))}
              type="number"
              sx={{
                width: '50px',
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
          </Grid2>
          <Grid2 size={4} maxWidth={250}>
            <TextField
              value={data.mem ? data.mem : ''}
              onChange={(e) => handleMemChange(index, e.target.value)}
            ></TextField>
          </Grid2>
          <Grid2 size={2}>
            <Button sx={{ ml: 2, bgcolor: 'red', color: 'white' }} onClick={() => handleRemove(index)}>
              削除
            </Button>
          </Grid2>
        </Grid2>
      ))}
    </>
  );
};
