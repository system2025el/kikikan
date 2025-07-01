'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, DialogTitle, Grid2, Stack, Typography, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  SelectElement,
  TextareaAutosizeElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';

// import { getOneCustomer } from '@/app/_lib/supabase/supabaseFuncs';
import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { customerMasterDialogDetailsValues, customerMaterDialogDetailsSchema } from '../_lib/types';

/**
 * 顧客マスタの顧客詳細ダイアログ
 * @param props
 * @returns {JSX.Element} 顧客ダイアログ
 */
export const CustomerDialogContents = ({
  customerId,
  handleClose,
  editable,
  setEditable,
}: {
  customerId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useTheme */
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  /* useState --------------------- */
  /** 顧客リスト */
  const [customer, setCustomer] = useState<customerMasterDialogDetailsValues>();
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      kokyakuNam: customer?.kokyakuNam,
      kana: customer?.kana,
      kokyakuRank: customer?.kokyakuRank,
      keisho: customer?.keisho,
      adrPost: customer?.adrPost,
      adrShozai: customer?.adrShozai,
      adrTatemono: customer?.adrTatemono,
      adrSonota: customer?.adrSonota,
      tel: customer?.tel,
      telMobile: customer?.telMobile,
      mail: customer?.mail,
      mem: customer?.mem,
      delFlg: customer?.delFlg,
      dspFlg: customer?.dspFlg,
      closeDay: customer?.closeDay,
      siteDay: customer?.siteDay,
      kizaiNebikiFlg: customer?.kizaiNebikiFlg,
    }, //DB customer,
    resolver: zodResolver(customerMaterDialogDetailsSchema),
  });

  /* 関数 ---------------------------- */
  /* ダイアログ内を編集モードにする */
  const handleEditable = () => {
    setEditable(true);
  };
  /* フォームを送信 */
  const onSubmit = (data: customerMasterDialogDetailsValues) => {
    // handleCloseDialog();
    console.log(isDirty);
    console.log(data);
  };
  /* ダイアログを閉じる */
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
            <FormBox formItem={formItems[0]} required={true}>
              <TextFieldElement
                name="kokyakuNam"
                control={control}
                label={formItems[0].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[1]} required={true}>
              <TextFieldElement
                name="kana"
                control={control}
                label={formItems[1].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[2]} required={true}>
              <SelectElement
                name="kokyakuRank"
                control={control}
                label={formItems[2].exsample}
                options={[
                  { id: 1, label: 1 },
                  { id: 2, label: 2 },
                  { id: 3, label: 3 },
                  { id: 4, label: 4 },
                  { id: 5, label: 5 },
                ]}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[3]}>
              <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[4]}>
              <TextFieldElement
                name="keisho"
                control={control}
                label={formItems[4].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[5]}>
              <TextFieldElement
                name="adrPost"
                control={control}
                label={formItems[5].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[6]}>
              <TextFieldElement
                name="adrShozai"
                control={control}
                label={formItems[6].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[7]}>
              <TextFieldElement
                name="adrTatemono"
                control={control}
                label={formItems[7].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[8]}>
              <TextFieldElement
                name="adrSonota"
                control={control}
                label={formItems[8].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[9]}>
              <TextFieldElement
                name="tel"
                control={control}
                label={formItems[9].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[10]}>
              <TextFieldElement
                name="telMobile"
                control={control}
                label={formItems[10].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[11]}>
              <TextFieldElement
                name="fax"
                control={control}
                label={formItems[11].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[12]}>
              <TextFieldElement
                name="mail"
                control={control}
                label={formItems[12].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[13]}>
              <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                name="mem"
                control={control}
                label={formItems[13].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[14]}>
              <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[15]}>
              <TextFieldElement
                name="closeDay"
                control={control}
                label={formItems[15].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[16]}>
              <TextFieldElement
                name="siteDay"
                control={control}
                label={formItems[16].exsample}
                fullWidth
                sx={{ maxWidth: '50%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
          <Grid2>
            <FormBox formItem={formItems[17]}>
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

const formItems: FormItemsType[] = [
  {
    label: '顧客名',
    exsample: '例）㈱エンジニア･ライティング',
    constraints: '100文字まで',
  },
  {
    label: '顧客かな',
    exsample: '例）えんじにあ　らいてぃんぐ',
    constraints: '100文字まで',
  },
  {
    label: '顧客ランク',
    exsample: '',
    constraints: '１～５選択',
  },
  {
    label: '削除フラグ',
    exsample: '',
    constraints: '論理削除（データは物理削除されません）',
  },
  {
    label: '顧客敬称',
    exsample: '',
    constraints: '10文字まで',
  },
  {
    label: '顧客住所（郵便番号）',
    exsample: '例）242-0018 ',
    constraints: '20文字まで',
  },
  {
    label: '顧客住所（所在地）',
    exsample: '例）神奈川県大和市深見西9-99-99',
    constraints: '100文字まで',
  },
  {
    label: '顧客住所（建物名）',
    exsample: '例）XXビル 11F',
    constraints: '100文字まで',
  },
  {
    label: '顧客住所（その他）',
    exsample: 'その他の住所情報',
    constraints: '100文字まで',
  },
  {
    label: '電話',
    exsample: '例）046-999-1234',
    constraints: '20文字まで',
  },
  {
    label: '携帯',
    exsample: '例）070-9999-9999',
    constraints: '20文字まで',
  },
  {
    label: 'FAX',
    exsample: '例）046-999-1235',
    constraints: '20文字まで',
  },
  {
    label: 'メールアドレス',
    exsample: '例）abc@zzz.co.jp',
    constraints: '100文字まで',
  },
  {
    label: 'メモ',
    exsample: '',
    constraints: '200文字まで',
  },
  {
    label: '表示フラグ',
    exsample: '',
    constraints: '選択リストへの表示',
  },
  {
    label: '月締日',
    exsample: '例）31、15　※月末締めの場合31を指定',
    constraints: '数字',
  },
  {
    label: '支払サイト日数',
    exsample: '例）月末締め翌月末払いの場合30、翌々月末払いは60を指定',
    constraints: '数字',
  },
  {
    label: '機材値引き対象フラグ',
    exsample: '',
    constraints: '数字',
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
