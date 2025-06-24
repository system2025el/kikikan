'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, DialogTitle, Grid2, Stack, Typography, useTheme } from '@mui/material';
import { useState } from 'react';
import { CheckboxElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '@/app/(main)/_ui/form-box';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { LocMasterSchema, LocMasterValues } from '../_lib/types';

export const LocationsMasterDialog = (props: {
  locationId: number | string;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  const { locationId, handleClose, editable, setEditable } = props;

  const handleEditable = () => {
    setEditable(true);
  };
  const handleCloseDialog = () => {
    setEditable(false);
    handleClose();
  };
  const [location, setLocation] = useState<LocMasterValues>();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {},
    resolver: zodResolver(LocMasterSchema),
  });

  const onSubmit = (data: LocMasterValues) => {
    handleCloseDialog();
    console.log(isDirty);
    console.log(data);
  };

  // useEffect(() => {
  //   const getThatOneCustomer = async () => {
  //     const customer1 = await getOneCustomer(customerId);
  //     console.log(customerId);
  //     console.log('?????????????????????????????????????????????????????', customer1);
  //     setCustomer(customer1!);
  //   };
  //   getThatOneCustomer();
  //   console.log('chaaaaaaaaaaaaaaaaaaaaaange', customer);
  // }, [customerId]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          colorOfThis={colorOfThis}
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle={'公演場所'}
        />

        <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
          <Grid2>
            <FormBox label={formItems[0].label} description={formItems[0].description} required={true}>
              <TextFieldElement
                name="locNam"
                control={control}
                label={formItems[0].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[1].label} description={formItems[1].description} required={true}>
              <TextFieldElement
                name="kana"
                control={control}
                label={formItems[1].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>

          <Grid2>
            <FormBox label={formItems[2].label} description={formItems[2].description}>
              <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[3].label} description={formItems[3].description}>
              <TextFieldElement
                name="adrPost"
                control={control}
                label={formItems[3].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[4].label} description={formItems[4].description}>
              <TextFieldElement
                name="adrShozai"
                control={control}
                label={formItems[4].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[5].label} description={formItems[5].description}>
              <TextFieldElement
                name="adrTatemono"
                control={control}
                label={formItems[5].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[6].label} description={formItems[6].description}>
              <TextFieldElement
                name="adrSonota"
                control={control}
                label={formItems[6].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[7].label} description={formItems[7].description}>
              <TextFieldElement
                name="tel"
                control={control}
                label={formItems[7].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[8].label} description={formItems[8].description}>
              <TextFieldElement
                name="telMobile"
                control={control}
                label={formItems[8].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[9].label} description={formItems[9].description}>
              <TextFieldElement
                name="fax"
                control={control}
                label={formItems[9].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[10].label} description={formItems[10].description}>
              <TextFieldElement
                name="mail"
                control={control}
                label={formItems[10].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[11].label} description={formItems[11].description}>
              <TextFieldElement ////////////// 200文字までの設定をしなければならない
                name="mem"
                control={control}
                label={formItems[11].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[12].label} description={formItems[12].description}>
              <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
            </FormBox>
          </Grid2>
        </Grid2>
      </form>
    </>
  );
};

/* 移動する予定move */
type formItemsType = { label: string; description: string };
const formItems: formItemsType[] = [
  {
    label: '公演場所名',
    description: '100文字まで',
  },
  {
    label: '公演場所かな',
    description: '100文字まで',
  },
  {
    label: '削除フラグ',
    description: '論理削除（データは物理削除されません）',
  },
  {
    label: '公演場所住所（郵便番号）',
    description: '例）242-0018 ',
  },
  {
    label: '公演場所住所（所在地）',
    description: '例）神奈川県大和市深見西9-99-99',
  },
  {
    label: '公演場所住所（建物名）',
    description: '例）XXビル 11F',
  },
  {
    label: '公演場所住所（その他）',
    description: 'その他の住所情報',
  },
  {
    label: '代表電話',
    description: '例）046-999-1234',
  },
  {
    label: '代表携帯',
    description: '例）070-9999-9999',
  },
  {
    label: '代表FAX',
    description: '例）046-999-1235',
  },
  {
    label: '代表メールアドレス',
    description: '例）abc@zzz.co.jp',
  },
  {
    label: 'メモ',
    description: '200文字まで',
  },
  {
    label: '表示フラグ',
    description: '選択リストへの表示',
  },
];

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
