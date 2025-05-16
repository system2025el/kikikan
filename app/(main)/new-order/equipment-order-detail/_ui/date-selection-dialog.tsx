import { Box, Button, Container, Tab, Tabs, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { RSuiteDateRangePicker } from '@/app/(main)/_ui/date';

type TabPanelProps = {
  children?: React.ReactNode;
  index: string;
  value: string;
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const DateSelectDialog = (props: { handleCloseCustDialog: () => void }) => {
  const [value, setValue] = useState('仕込');
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };
  return (
    <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2} bgcolor={grey[300]}>
        <Typography margin={1}>日付選択</Typography>
        <Box>
          <Button sx={{ mx: 4 }}>保存</Button>
          <Button sx={{ mx: 4 }}>追加</Button>
        </Box>
        <Button sx={{ margin: 1 }} onClick={props.handleCloseCustDialog}>
          戻る
        </Button>
      </Box>
      <Box bgcolor={grey[200]} mt={2}>
        <Box display="flex" sx={{ pt: 3, bgcolor: grey[300] }}>
          <Tabs value={value} onChange={handleChange}>
            <Tab value="仕込" label="仕込" sx={{ bgcolor: 'purple' }} />
            <Tab value="RH" label="RH" sx={{ bgcolor: 'orange' }} />
            <Tab value="GP" label="GP" sx={{ bgcolor: 'green' }} />
            <Tab value="本番" label="本番" sx={{ bgcolor: 'pink' }} />
          </Tabs>
          <Box ml={20}>
            <Button sx={{ ml: 2 }}>追加</Button>
          </Box>
        </Box>
        <TabPanel value={value} index="仕込">
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
        </TabPanel>
        <TabPanel value={value} index="RH">
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
        </TabPanel>
        <TabPanel value={value} index="GP">
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
        </TabPanel>
        <TabPanel value={value} index="本番">
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
          <Box display="flex" alignItems="center" margin={2}>
            <RSuiteDateRangePicker />
            <Typography ml={2} mr={1}>
              メモ
            </Typography>
            <TextField defaultValue={'XXXXXXXX'}></TextField>
            <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }}>削除</Button>
          </Box>
        </TabPanel>
      </Box>
    </Container>
  );
};
