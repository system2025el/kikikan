'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, DialogTitle, Grid2, Stack, Typography, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { CheckboxElement, SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

// import { getOneCustomer } from '@/app/_lib/supabase/supabaseFuncs';
import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { customerMasterDialogDetailsValues, customerMaterDialogDetailsSchema } from '../_lib/types';

export const CustomerDialogContents = (props: {
  customerId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  const { customerId, handleClose, editable, setEditable } = props;

  const handleEditable = () => {
    setEditable(true);
  };

  const [customer, setCustomer] = useState<customerMasterDialogDetailsValues>();
  const [isLoading, setIsLoading] = useState(true);

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: customer,
    resolver: zodResolver(customerMaterDialogDetailsSchema),
  });

  const onSubmit = (data: customerMasterDialogDetailsValues) => {
    handleCloseDialog();
    console.log(isDirty);
    console.log(data);
  };

  const handleCloseDialog = () => {
    console.log('☆☆☆☆☆☆★★★★', customer);
    handleClose();
  };

  // useEffect(() => {
  //   const getThatOneCustomer = async () => {
  //     const customer1 = await getOneCustomer(customerId);
  //     reset(customer1);
  //     console.log(customerId);
  //     console.log('?????????????????????????????????????????????????????', customer1);
  //     setCustomer(customer1!);
  //     setIsLoading(false);
  //   };
  //   getThatOneCustomer();
  // }, [customerId, reset]);
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          colorOfThis={colorOfThis}
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle="顧客マスタ登録"
        />
        {/* {isLoading ? ( //DB
          <Loading />
        ) : ( */}
        <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
          <Grid2>
            <FormBox label={formItems[0].label} description={formItems[0].description} required={true}>
              <TextFieldElement
                name="kokyakuNam"
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
            <FormBox label={formItems[2].label} description={formItems[2].description} required={true}>
              <SelectElement
                name="kokyakuRank"
                control={control}
                label={formItems[2].description}
                options={[
                  { id: 1, label: 1 },
                  { id: 2, label: 2 },
                  { id: 3, label: 3 },
                  { id: 4, label: 4 },
                  { id: 5, label: 5 },
                ]}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[3].label} description={formItems[3].description}>
              <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[4].label} description={formItems[4].description}>
              <TextFieldElement
                name="keisho"
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
                name="adrPost"
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
                name="adrShozai"
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
                name="adrTatemono"
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
                name="adrSonota"
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
                name="tel"
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
                name="telMobile"
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
              <TextFieldElement
                name="fax"
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
              <TextFieldElement
                name="mail"
                control={control}
                label={formItems[12].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[13].label} description={formItems[13].description}>
              <TextFieldElement ////////////// 200文字までの設定をしなければならない
                name="mem"
                control={control}
                label={formItems[13].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[14].label} description={formItems[14].description}>
              <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[15].label} description={formItems[15].description}>
              <TextFieldElement
                name="closeDay"
                control={control}
                label={formItems[15].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[16].label} description={formItems[16].description}>
              <TextFieldElement
                name="siteDay"
                control={control}
                label={formItems[16].description}
                fullWidth
                sx={{ maxWidth: '80%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox label={formItems[17].label} description={formItems[17].description}>
              <CheckboxElement
                name="kizaiNebikiFlg"
                control={control}
                size="medium"
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
        </Grid2>
        {/* )} */}
      </form>
    </>
  );
};

/* 移動する予定move */
type formItemsType = { label: string; description: string };
const formItems: formItemsType[] = [
  {
    label: '顧客名',
    description: '社名、氏名、団体名　※前㈱、後㈱等も付記',
  },
  {
    label: '顧客かな',
    description: 'かな名',
  },
  {
    label: '顧客ランク',
    description: '１～５',
  },
  {
    label: '削除フラグ',
    description: '論理削除（データは物理削除されません）',
  },
  {
    label: '顧客敬称',
    description: '例）御中、様',
  },
  {
    label: '顧客住所（郵便番号）',
    description: '例）242-0018 ',
  },
  {
    label: '顧客住所（所在地）',
    description: '例）神奈川県大和市深見西9-99-99',
  },
  {
    label: '顧客住所（建物名）',
    description: '例）XXビル 11F',
  },
  {
    label: '顧客住所（その他）',
    description: 'その他の住所情報',
  },
  {
    label: '電話',
    description: '例）046-999-1234',
  },
  {
    label: '携帯',
    description: '例）070-9999-9999',
  },
  {
    label: 'FAX',
    description: '例）046-999-1235',
  },
  {
    label: 'メールアドレス',
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
  {
    label: '月締日',
    description: '例）31、15　※月末締めの場合31を指定',
  },
  {
    label: '支払サイト日数',
    description: '例）月末締め翌月末払いの場合30、翌々月末払いは60を指定',
  },
  {
    label: '機材値引き対象フラグ',
    description: '',
  },
];

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  greyBox: {
    border: 1,
    borderColor: grey[500],
    backgroundColor: grey[300],
    paddingLeft: 1,
    marginLeft: 1,
    paddingRight: 1,
    minHeight: '30px',
    maxHeight: '30px',
  },
  greyBoxMemo: {
    border: 1,
    borderColor: grey[500],
    backgroundColor: grey[300],
    paddingLeft: 1,
    marginLeft: 1,
    paddingRight: 1,
    minHeight: '150px',
    maxHeight: '150px',
  },
  margintop1: {
    marginTop: 1,
  },
  justContentBox: {
    display: 'flex',
  },
};
