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

  const handleAddInput = (value: string) => {
    console.log(value);
    switch (value) {
      case '仕込':
        return setInputPreparation([...inputPreparation, '']);
      case 'RH':
        return setInputRH([...inputRH, '']);
      case 'GP':
        return setInputGP([...inputGP, '']);
      case '本番':
        return setInputActual([...inputActual, '']);
    }
  };

  const [inputPreparation, setInputPreparation] = useState<string[]>([]);
  const handleInputPreparationChange = (index: number, value: string) => {
    const updatedInputs = [...inputPreparation];
    updatedInputs[index] = value;
    setInputPreparation(updatedInputs);
  };
  const handleRemoveInputPreparation = (index: number) => {
    const updatedInputs = inputPreparation.filter((_, i) => i !== index);
    setInputPreparation(updatedInputs);
  };

  const [inputRH, setInputRH] = useState<string[]>([]);
  const handleInputRHChange = (index: number, value: string) => {
    const updatedInputs = [...inputRH];
    updatedInputs[index] = value;
    setInputRH(updatedInputs);
  };
  const handleRemoveInputRH = (index: number) => {
    const updatedInputs = inputRH.filter((_, i) => i !== index);
    setInputRH(updatedInputs);
  };

  const [inputGP, setInputGP] = useState<string[]>([]);
  const handleInputGPChange = (index: number, value: string) => {
    const updatedInputs = [...inputGP];
    updatedInputs[index] = value;
    setInputGP(updatedInputs);
  };
  const handleRemoveInputGP = (index: number) => {
    const updatedInputs = inputGP.filter((_, i) => i !== index);
    setInputGP(updatedInputs);
  };

  const [inputActual, setInputActual] = useState<string[]>([]);
  const handleInputActualChange = (index: number, value: string) => {
    const updatedInputs = [...inputActual];
    updatedInputs[index] = value;
    setInputActual(updatedInputs);
  };
  const handleRemoveInputActual = (index: number) => {
    const updatedInputs = inputActual.filter((_, i) => i !== index);
    setInputActual(updatedInputs);
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
            <Button sx={{ ml: 2 }} onClick={() => handleAddInput(value)}>
              追加
            </Button>
          </Box>
        </Box>
        <TabPanel value={value} index="仕込">
          {inputPreparation.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <RSuiteDateRangePicker />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={input}
                onChange={(e) => handleInputPreparationChange(index, e.target.value)}
              ></TextField>
              <Button
                sx={{ ml: 4, bgcolor: 'red', color: 'white' }}
                onClick={() => handleRemoveInputPreparation(index)}
              >
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index="RH">
          {inputRH.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <RSuiteDateRangePicker />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField value={input} onChange={(e) => handleInputRHChange(index, e.target.value)}></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleRemoveInputRH(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index="GP">
          {inputGP.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <RSuiteDateRangePicker />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField value={input} onChange={(e) => handleInputGPChange(index, e.target.value)}></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleRemoveInputGP(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index="本番">
          {inputActual.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <RSuiteDateRangePicker />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField value={input} onChange={(e) => handleInputActualChange(index, e.target.value)}></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleRemoveInputActual(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
      </Box>
    </Container>
  );
};
