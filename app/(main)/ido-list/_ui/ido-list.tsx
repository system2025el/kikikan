'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Dialog, Divider, Grid2, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { permission } from '../../_lib/permission';
import { TestDate } from '../../_ui/date';
import { Loading } from '../../_ui/loading';
import { PermissionGuard } from '../../_ui/permission-guard';
import { getIdoList } from '../_lib/funcs';
import { IdoTableValues } from '../_lib/types';
import { IdoListTable } from './ido-list-table';

export const IdoList = () => {
  // ローディング制御
  const [isLoading, setIsLoading] = useState(true);

  const [idoList, setIdoList] = useState<IdoTableValues[]>([]);

  /* useForm ------------------- */
  const { control, handleSubmit, getValues, reset } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      idoDat: new Date(),
    },
  });

  /**
   * 検索ボタン押下
   * @param data 検索データ(受注番号、出庫日、出庫場所)
   */
  const onSubmit = async (data: { idoDat: Date }) => {
    setIsLoading(true);
    sessionStorage.setItem('idoListSearchParams', JSON.stringify(getValues()));
    const idoData = await getIdoList(toJapanYMDString(data.idoDat, '-'));
    if (idoData) {
      setIdoList(idoData);
    }
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const searchPramsString = sessionStorage.getItem('idoListSearchParams');
    const searchParams = searchPramsString ? JSON.parse(searchPramsString) : null;

    const getList = async (searchParams: { idoDat: Date }) => {
      setIsLoading(true);
      const date = toJapanYMDString(searchParams.idoDat, '-');
      const idoData = await getIdoList(date);
      if (!idoData) {
        return <div>エラー</div>;
      }
      setIdoList(idoData);
      setIsLoading(false);
    };

    if (searchParams) {
      reset(searchParams);
      getList(searchParams);
    } else {
      getList(getValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PermissionGuard category={'nyushuko'} required={permission.nyushuko_ref}>
      <Box>
        <Paper variant="outlined">
          <Box alignItems="center" px={2}>
            <Typography>移動検索</Typography>
          </Box>
          <Divider />
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container alignItems={'center'} p={2} spacing={4}>
              <Box display={'flex'} alignItems={'center'} width={'fit-content'}>
                <Typography mr={2}>移動日</Typography>
                <Controller
                  name="idoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TestDate
                      onBlur={field.onBlur}
                      date={field.value}
                      onChange={(newDate) => field.onChange(newDate?.toDate())}
                      fieldstate={fieldState}
                    />
                  )}
                />
              </Box>
              <Button type="submit" loading={isLoading}>
                <SearchIcon fontSize="small" />
                検索
              </Button>
            </Grid2>
          </form>
          <Divider />
          {isLoading ? (
            <Loading />
          ) : idoList.length > 0 ? (
            <Box width={'100%'} mt={4}>
              <IdoListTable datas={idoList} />
            </Box>
          ) : (
            <div>エラー</div>
          )}
        </Paper>
      </Box>
    </PermissionGuard>
  );
};
