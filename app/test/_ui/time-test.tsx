'use client';

import {
  Box,
  Button,
  Container,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { Dayjs } from 'dayjs';
import { useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeStampString, toTimeStampString } from '@/app/(main)/_lib/date-conversion';
import { DateTime, FormDateX } from '@/app/(main)/_ui/date';

import { getTimeTest, insertTimeTest } from '../_lib/funcs';

export const TimeTest = () => {
  const [testlist, setTestlist] = useState<{ id: number; created: Date | null; shuko: Date | null }[]>([]);

  const form = useForm<{ id: number; created: Date | null; shuko: Date | null }>({});
  const { handleSubmit: fhandleSubmit, setValue: fsetvalue, control: fcontrol, watch: fwatch } = form;
  const fonSubmit = async (data: { id: number; created: Date | null; shuko: Date | null }) => {
    console.log(data);
    await insertTimeTest(data);
  };

  const search = useForm<{ id: number | null; created: Date | null; shuko: Date | null }>({
    defaultValues: { id: null, created: null, shuko: null },
  });
  const { handleSubmit: shandleSubmit, setValue: ssetvalue, control: scontrol, watch: swatch } = search;
  const sonSubmit = async (data: { id: number | null; created: Date | null; shuko: Date | null }) => {
    console.log(data);
    const d: { id: number; created: Date | null; shuko: Date | null }[] = await getTimeTest(data);
    console.log(d);
    if (d) {
      setTestlist(d);
    }
  };

  const fc = fwatch('created');
  const fs = fwatch('shuko');

  const sc = swatch('created');
  const ss = swatch('shuko');

  return (
    <Container>
      <Box sx={{ border: 1, borderColor: 'divider' }}>
        <Typography variant="h3">Form</Typography>
        <form onSubmit={fhandleSubmit(fonSubmit)}>
          <Stack>
            id: <TextFieldElement name="id" control={fcontrol} />
          </Stack>
          <Controller
            control={fcontrol}
            name="created"
            render={({ field, fieldState }) => (
              <DateTime
                date={field.value}
                onChange={(newDate: Dayjs | null) => {
                  if (newDate === null) return;
                  fsetvalue('created', newDate.toDate(), { shouldDirty: true });
                }}
                onAccept={(newDate: Dayjs | null) => {
                  if (newDate === null) return;
                }}
                fieldstate={fieldState}
                onClear={() => fsetvalue('created', null, { shouldDirty: true })}
              />
            )}
          />
          {fc ? toJapanTimeStampString(fc) : '無'}
          <Stack>
            shuko_dat:
            <Controller
              control={fcontrol}
              name="shuko"
              render={({ field, fieldState: { error } }) => (
                <FormDateX
                  value={field.value}
                  onChange={field.onChange}
                  sx={{ mr: 1 }}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            {fs ? toJapanTimeStampString(fs) : '無'}
            <Button type="submit">submit</Button>
          </Stack>
        </form>
      </Box>

      <Box sx={{ border: 1, borderColor: 'divider' }}>
        <Typography variant="h3">Search</Typography>
        <form onSubmit={shandleSubmit(sonSubmit)}>
          <Stack>
            id: <TextFieldElement name="id" control={scontrol} />
          </Stack>
          <Stack>
            created_dat:
            <Controller
              control={scontrol}
              name="created"
              render={({ field, fieldState }) => (
                <DateTime
                  date={field.value}
                  onChange={(newDate: Dayjs | null) => {
                    if (newDate === null) return;
                    ssetvalue('created', newDate.toDate(), { shouldDirty: true });
                  }}
                  onAccept={(newDate: Dayjs | null) => {
                    if (newDate === null) return;
                  }}
                  fieldstate={fieldState}
                  onClear={() => ssetvalue('created', null, { shouldDirty: true })}
                />
              )}
            />
            {sc ? toJapanTimeStampString(sc) : '無'}
          </Stack>
          <Stack>
            shuko_dat:
            <Controller
              control={scontrol}
              name="shuko"
              render={({ field, fieldState: { error } }) => (
                <FormDateX
                  value={field.value}
                  onChange={field.onChange}
                  sx={{ mr: 1 }}
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            {ss ? toJapanTimeStampString(ss) : '無'}
            <Button type="submit">search</Button>
          </Stack>
        </form>
        <TableContainer>
          {testlist && testlist.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>id</TableCell>
                  <TableCell>created_at</TableCell>
                  <TableCell>shuko_dat</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testlist.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.id}</TableCell>
                    <TableCell>{d.created ? toJapanTimeStampString(d.created) : ''}</TableCell>
                    <TableCell>{d.shuko ? toTimeStampString(d.shuko) : ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </Container>
  );
};
