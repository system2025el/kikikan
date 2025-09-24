import {
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  Grid2,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { Loading } from '../../_ui/loading';
import { getOyaJuchuKizaiMeisai } from '../_lib/funcs';
import { OyaJuchuKizaiMeisaiValues } from '../_lib/types';

export const OyaEqSelectionDialog = ({
  juchuHeadId,
  oyaJuchuKizaiHeadId,
  setEqpts,
  onClose,
}: {
  juchuHeadId: number;
  oyaJuchuKizaiHeadId: number;
  setEqpts: (data: OyaJuchuKizaiMeisaiValues[]) => void;
  onClose: (result: boolean) => void;
}) => {
  // 親機材リスト
  const [oyaEqList, setOyaEqList] = useState<OyaJuchuKizaiMeisaiValues[]>([]);
  // 選択機材id
  const [selected, setSelected] = useState<number[]>([]);
  // Loadingかどうか
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const handleToggle = (id: number) => {
    const newSelected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];
    setSelected(newSelected);
  };

  /* 確定ボタン押下時 */
  const handleClickConfirm = () => {
    const selectData = oyaEqList.filter((data) => selected.includes(data.kizaiId));
    setEqpts(selectData);
    onClose(false);
  };

  /* useeffect -------------------------------------- */
  useEffect(() => {
    const getOyaEqpts = async () => {
      const oyaEq = await getOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
      console.log('親機材リスト: ', oyaEq);
      setOyaEqList(oyaEq ?? []);
      setIsLoading(false);
    };
    getOyaEqpts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container sx={{ p: 2 }}>
      <Box display={'flex'} justifyContent={'end'} my={1}>
        <Grid2 container spacing={2}>
          <Button onClick={handleClickConfirm}>確定</Button>
          <Button onClick={() => onClose(false)}>戻る</Button>
        </Grid2>
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>機材選択</Typography>
        </Box>
        <Divider />
        {isLoading ? (
          <Loading />
        ) : (
          <List
            sx={{
              width: '100%',
              bgcolor: 'background.paper',
              position: 'relative',
              overflow: 'auto',
              maxHeight: '65vh',
            }}
          >
            {oyaEqList.map((value) => {
              return (
                <ListItem key={value.kizaiId} disablePadding>
                  <ListItemButton onClick={() => handleToggle(value.kizaiId)} dense>
                    <ListItemIcon>
                      <Checkbox edge="start" checked={selected.includes(value.kizaiId)} tabIndex={-1} disableRipple />
                    </ListItemIcon>
                    <ListItemText primary={value.kizaiNam} />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>
    </Container>
  );
};
