'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { alpha, Button, DialogTitle, Grid2, Stack, Typography, useTheme } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';
import { CheckboxElement, SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '@/app/(main)/_ui/form-box';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { ManagerMasterDialogDetailsValues, managerMaterDialogDetailsSchema } from '../_lib/types';
/**
 * 担当者マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 担当者マスタの詳細ダイアログコンポーネント
 */
export const ManagerDialogContents = ({
  managerId,
  handleClose,
  editable,
  setEditable,
}: {
  managerId: number;
  handleClose: () => void;
  editable: boolean;
  setEditable: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useState --------------------- */
  /** 担当者リストの配列 */
  const [manager, setManager] = useState<ManagerMasterDialogDetailsValues>();
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
    defaultValues: manager,
    resolver: zodResolver(managerMaterDialogDetailsSchema),
  });

  /* 関数 ---------------------------- */
  /* ダイアログ内を編集モードにする */
  const handleEditable = () => {
    setEditable(true);
  };
  /* ダイアログを閉じる */
  const handleCloseDialog = () => {
    handleClose();
    setEditable(false);
  };
  /* フォームを送信 */
  const onSubmit = (data: ManagerMasterDialogDetailsValues) => {
    // handleCloseDialog();
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
          editable={editable}
          handleEditable={handleEditable}
          handleCloseDialog={handleCloseDialog}
          dialogTitle={'担当者情報'}
        />
        <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
          <Grid2>
            <FormBox formItem={formItems[0]} required={true}>
              <TextFieldElement
                name="tantouNam"
                control={control}
                label={formItems[0].exsample}
                fullWidth
                sx={{ maxWidth: '90%' }}
                disabled={editable ? false : true}
              />
            </FormBox>
          </Grid2>
        </Grid2>
      </form>
    </>
  );
};

/* 移動する予定move */

const formItems: FormItemsType[] = [
  {
    label: '担当者名',
    constraints: '100文字まで',
    exsample: 'あいうえお',
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
