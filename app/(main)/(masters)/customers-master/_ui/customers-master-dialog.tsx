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
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
import { emptyCustomer, formItems } from '../_lib/datas';
import { customerMasterDialogDetailsValues, customerMaterDialogDetailsSchema } from '../_lib/types';

/**
 * 顧客マスタの顧客詳細ダイアログ
 * @param props
 * @returns {JSX.Element} 顧客ダイアログ
 */
export const CustomersMasterDialog = ({
  customerId,
  handleClose,
  refetchCustomers,
}: {
  customerId: number;
  handleClose: () => void;
  refetchCustomers: () => void;
}) => {
  /* useState --------------------- */
  /** 顧客リスト */
  const [customer, setCustomer] = useState<customerMasterDialogDetailsValues>();
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);

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
      kokyakuNam: '',
      kana: '',
      kokyakuRank: 0,
      keisho: '',
      adrPost: '',
      adrShozai: '',
      adrTatemono: '',
      adrSonota: '',
      tel: '',
      telMobile: '',
      mail: '',
      mem: '',
      delFlg: false,
      dspFlg: true,
      closeDay: 0,
      siteDay: 0,
      kizaiNebikiFlg: false,
    }, //DB customer,
    resolver: zodResolver(customerMaterDialogDetailsSchema),
  });

  /* 関数 ---------------------------- */
  /* フォームを送信 */
  const onSubmit = (data: customerMasterDialogDetailsValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (customerId === -100) {
    //   await addNewCustomer(data);
    // } else {
    //   await updateCustomer(data, customerId);
    // }
    handleCloseDialog();
    refetchCustomers();
  };
  /* ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
  };
  /* 未保存ダイアログを閉じる */
  const handleCloseDirty = () => {
    setDirtyOpen(false);
  };

  /* ×ぼたんを押したとき */
  const handleClickClose = () => {
    console.log('isDirty : ', isDirty);
    if (isDirty) {
      setDirtyOpen(true);
    } else {
      handleCloseDialog();
    }
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneCustomer = async () => {
      if (customerId === -100) {
        // 新規追加モード
        setCustomer(emptyCustomer);
        reset(); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const customer1 = await getOnecustomer(customerId);
        // if (customer1) {
        //   setcustomer(customer1);
        //   reset(customer1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOneCustomer();
    console.log('chaaaaaage : ', customer);
  }, [customerId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="顧客マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required>
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
                <FormBox formItem={formItems[1]} required>
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
                <FormBox formItem={formItems[2]} required>
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
            <IsDirtyDialog open={dirtyOpen} handleCloseDirty={handleCloseDirty} handleCloseAll={handleCloseDialog} />
          </>
        )}
      </form>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
