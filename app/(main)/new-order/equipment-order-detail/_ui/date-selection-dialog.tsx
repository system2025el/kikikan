'use client';

import { Box, Button, Container, Tab, Tabs, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';

import { RSuiteDateRangePicker, toISOStringWithTimezone } from '@/app/(main)/_ui/date';

type TabPanelProps = {
  children?: React.ReactNode;
  index: string;
  value: string;
};

type DateDialogProps = {
  preparationRange: string[];
  preparationMemo: string[];
  RHRange: string[];
  RHMemo: string[];
  GPRange: string[];
  GPMemo: string[];
  actualRange: string[];
  actualMemo: string[];
  onClose: () => void;
  onSave: (
    preparationDates: string[],
    preparationMemo: string[],
    RHDates: string[],
    RHMemo: string[],
    GPDates: string[],
    GPMemo: string[],
    actualDates: string[],
    actualMemo: string[]
  ) => void;
};

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const DateSelectDialog = ({
  preparationRange,
  preparationMemo,
  RHRange,
  RHMemo,
  GPRange,
  GPMemo,
  actualRange,
  actualMemo,
  onClose,
  onSave,
}: DateDialogProps) => {
  const handleSave = () => {
    onSave(preparationDates, inputPreparation, RHDates, inputRH, GPDates, inputGP, actualDates, inputActual); // 親に渡す
  };
  const [value, setValue] = useState('仕込');
  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleAddInput = (value: string) => {
    if (dateRange !== null) {
      const newDates = getDateRange(dateRange[0], dateRange[1]);
      switch (value) {
        case '仕込':
          setPreparationDates((prevDates) => [...prevDates, ...newDates]);
          break;
        case 'RH':
          setRHDates((prevDates) => [...prevDates, ...newDates]);
          break;
        case 'GP':
          setGPDates((prevDates) => [...prevDates, ...newDates]);
          break;
        case '本番':
          setActualDates((prevDates) => [...prevDates, ...newDates]);
          break;
      }
    }
  };

  const [preparationDates, setPreparationDates] = useState<string[]>(preparationRange);
  const [inputPreparation, setInputPreparation] = useState<string[]>(preparationMemo);
  const handleInputPreparationChange = (index: number, value: string) => {
    const updatedInputs = [...inputPreparation];
    updatedInputs[index] = value;
    setInputPreparation(updatedInputs);
  };
  const handleRemoveInputPreparation = (index: number) => {
    const updatedDates = preparationDates.filter((_, i) => i !== index);
    const updatedInputs = inputPreparation.filter((_, i) => i !== index);
    setPreparationDates(updatedDates);
    setInputPreparation(updatedInputs);
  };

  const [RHDates, setRHDates] = useState<string[]>(RHRange);
  const [inputRH, setInputRH] = useState<string[]>(RHMemo);
  const handleInputRHChange = (index: number, value: string) => {
    const updatedInputs = [...inputRH];
    updatedInputs[index] = value;
    setInputRH(updatedInputs);
  };
  const handleRemoveInputRH = (index: number) => {
    const updatedDates = RHDates.filter((_, i) => i !== index);
    const updatedInputs = inputRH.filter((_, i) => i !== index);
    setRHDates(updatedDates);
    setInputRH(updatedInputs);
  };

  const [GPDates, setGPDates] = useState<string[]>(GPRange);
  const [inputGP, setInputGP] = useState<string[]>(GPMemo);
  const handleInputGPChange = (index: number, value: string) => {
    const updatedInputs = [...inputGP];
    updatedInputs[index] = value;
    setInputGP(updatedInputs);
  };
  const handleRemoveInputGP = (index: number) => {
    const updatedDates = GPDates.filter((_, i) => i !== index);
    const updatedInputs = inputGP.filter((_, i) => i !== index);
    setGPDates(updatedDates);
    setInputGP(updatedInputs);
  };

  const [actualDates, setActualDates] = useState<string[]>(actualRange);
  const [inputActual, setInputActual] = useState<string[]>(actualMemo);
  const handleInputActualChange = (index: number, value: string) => {
    const updatedInputs = [...inputActual];
    updatedInputs[index] = value;
    setInputActual(updatedInputs);
  };
  const handleRemoveInputActual = (index: number) => {
    const updatedDates = actualDates.filter((_, i) => i !== index);
    const updatedInputs = inputActual.filter((_, i) => i !== index);
    setActualDates(updatedDates);
    setInputActual(updatedInputs);
  };

  const [dateRange, setDateRange] = useState<[Date, Date] | null>([new Date(), new Date()]);

  const handleDateChange = (range: [Date, Date] | null) => {
    setDateRange(range);
  };

  const getDateRange = (start: Date, end: Date): string[] => {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezone(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
      <Box display="flex" justifyContent="space-between" alignItems="center" p={2} bgcolor={grey[300]}>
        <Typography margin={1}>日付選択</Typography>
        <Box>
          <Button sx={{ mx: 4 }} onClick={handleSave}>
            保存
          </Button>
          <Button
            sx={{ mx: 4 }}
            onClick={() => {
              console.log('仕込日', { preparationDates }, { inputPreparation });
              console.log('RH日', { RHDates }, { inputRH });
              console.log('GP日', { GPDates }, { inputGP });
              console.log('本番日', { actualDates }, { inputActual });
            }}
          >
            追加
          </Button>
        </Box>
        <Button sx={{ margin: 1 }} onClick={onClose}>
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
            <RSuiteDateRangePicker value={dateRange} onChange={handleDateChange} />
            <Button sx={{ ml: 2 }} onClick={() => handleAddInput(value)}>
              追加
            </Button>
          </Box>
        </Box>
        <TabPanel value={value} index="仕込">
          {preparationDates.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={input} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={inputPreparation[index] ?? ''}
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
          {RHDates.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={input} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={inputRH[index] ?? ''}
                onChange={(e) => handleInputRHChange(index, e.target.value)}
              ></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleRemoveInputRH(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index="GP">
          {GPDates.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={input} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={inputGP[index] ?? ''}
                onChange={(e) => handleInputGPChange(index, e.target.value)}
              ></TextField>
              <Button sx={{ ml: 4, bgcolor: 'red', color: 'white' }} onClick={() => handleRemoveInputGP(index)}>
                削除
              </Button>
            </Box>
          ))}
        </TabPanel>
        <TabPanel value={value} index="本番">
          {actualDates.map((input, index) => (
            <Box display="flex" alignItems="center" margin={2} key={index}>
              <TextField value={input} />
              <Typography ml={2} mr={1}>
                メモ
              </Typography>
              <TextField
                value={inputActual[index] ?? ''}
                onChange={(e) => handleInputActualChange(index, e.target.value)}
              ></TextField>
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
