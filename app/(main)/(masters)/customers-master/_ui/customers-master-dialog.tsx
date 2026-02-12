'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2, Snackbar, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  Controller,
  SelectElement,
  TextareaAutosizeElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';

import { User, useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyCustomer, formItems } from '../_lib/datas';
import { addNewCustomer, getChosenCustomer, updateCustomer } from '../_lib/funcs';
import { CustomersMasterDialogValues, CustomersMaterDialogSchema } from '../_lib/types';

/**
 * 顧客マスタの顧客詳細ダイアログ
 * @param props
 * @returns {JSX.Element} 顧客ダイアログ
 */
export const CustomersMasterDialog = ({
  user,
  customerId,
  handleClose,
  refetchCustomers,
}: {
  user: User | null;
  customerId: number;
  handleClose: () => void;
  refetchCustomers: () => void;
}) => {
  /* useState --------------------- */
  /** 顧客リスト */
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  // エラーハンドリング
  const [error, setError] = useState<Error | null>(null);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* 削除フラグ確認ダイアログ出すかどうか */
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* submit時のactions (save, delete) */
  const [action, setAction] = useState<'save' | 'delete' | 'restore' | undefined>(undefined);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useForm ------------------------- */
  const {
    control,
    formState: { isDirty },
    watch,
    handleSubmit,
    reset,
    getValues,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: emptyCustomer,
    resolver: zodResolver(CustomersMaterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const name = watch('kokyakuNam');

  /* 関数 ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: CustomersMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (customerId === FAKE_NEW_ID) {
      // 新規の時
      try {
        await addNewCustomer(data, user?.name ?? '');
      } catch (e) {
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
        return;
      } finally {
        setIsLoading(false);
      }
      handleCloseDialog();
      refetchCustomers();
    } else {
      // 更新の時
      if (action === 'save') {
        // 保存終了ボタン押したとき
        try {
          await updateCustomer(data, customerId, user?.name ?? '');
        } catch (e) {
          setSnackBarMessage('保存に失敗しました');
          setSnackBarOpen(true);
          return;
        } finally {
          setIsLoading(false);
        }
        handleCloseDialog();
        refetchCustomers();
      } else if (action === 'delete') {
        setIsLoading(false);
        // 削除ボタン押したとき
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        try {
          await updateCustomer({ ...values, delFlg: false }, customerId, user?.name ?? '');
        } catch (e) {
          setSnackBarMessage('有効化に失敗しました');
          setSnackBarOpen(true);
          return;
        } finally {
          setIsLoading(false);
        }
        handleCloseDialog();
        refetchCustomers();
      }
    }
  };

  /* ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
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

  /* 削除確認ダイアログで削除選択時 */
  const handleConfirmDelete = async () => {
    setIsLoading(true);
    const values = await getValues();
    try {
      await updateCustomer({ ...values, delFlg: true }, customerId, user?.name ?? '');
    } catch (e) {
      setSnackBarMessage('無効化に失敗しました');
      setSnackBarOpen(true);
      return;
    } finally {
      setDeleteOpen(false);
      setIsLoading(false);
    }
    handleCloseDialog();
    await refetchCustomers();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneCustomer = async () => {
      if (customerId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyCustomer); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        try {
          const customer1 = await getChosenCustomer(customerId);
          if (customer1) {
            reset(customer1); // 取得したデータでフォーム初期化
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
        setIsLoading(false);
      }
    };
    getThatOneCustomer();
  }, [customerId, reset]);

  if (error) throw error;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          user={user}
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="顧客マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          push={isLoading}
          setAction={setAction}
          isDeleted={isDeleted!}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]}>
                <TextField value={customerId === -100 ? '' : customerId} disabled />
              </FormBox>
              <FormBox formItem={formItems[1]} required>
                <TextFieldElement
                  name="kokyakuNam"
                  control={control}
                  label={editable ? formItems[1].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[2]} required>
                <TextFieldElement
                  name="kana"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[3]}>
                <Controller
                  name="nebikiRat"
                  control={control}
                  disabled={editable ? false : true}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (/^\d*$/.test(raw)) {
                          field.onChange(raw === '' ? '' : Number(raw));
                        }
                      }}
                      type="number"
                      sx={{
                        width: 120,
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                    />
                  )}
                />
                <Typography>%</Typography>
              </FormBox>
              <FormBox formItem={formItems[5]}>
                <TextFieldElement
                  name="keisho"
                  control={control}
                  label={editable ? formItems[5].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[6]}>
                <TextFieldElement
                  name="adrPost"
                  control={control}
                  label={editable ? formItems[6].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[7]}>
                <TextFieldElement
                  name="adrShozai"
                  control={control}
                  label={editable ? formItems[7].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[8]}>
                <TextFieldElement
                  name="adrTatemono"
                  control={control}
                  label={editable ? formItems[8].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[9]}>
                <TextFieldElement
                  name="adrSonota"
                  control={control}
                  label={editable ? formItems[9].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[10]}>
                <TextFieldElement
                  name="tel"
                  control={control}
                  label={editable ? formItems[10].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[11]}>
                <TextFieldElement
                  name="telMobile"
                  control={control}
                  label={editable ? formItems[11].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[12]}>
                <TextFieldElement
                  name="fax"
                  control={control}
                  label={editable ? formItems[12].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '50%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[13]}>
                <TextFieldElement
                  name="mail"
                  control={control}
                  label={editable ? formItems[13].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                  type="email"
                />
              </FormBox>
              <FormBox formItem={formItems[14]}>
                <TextFieldElement
                  multiline
                  name="mem"
                  control={control}
                  label={editable ? formItems[14].exsample : ''}
                  fullWidth
                  minRows={3}
                  maxRows={3}
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[15]}>
                <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
              </FormBox>
            </Grid2>
            <IsDirtyAlertDialog
              open={dirtyOpen}
              handleCloseDirty={() => setDirtyOpen(false)}
              handleCloseAll={handleCloseDialog}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              data={name}
              push={isLoading}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleConfirmDelete={handleConfirmDelete}
            />
          </>
        )}
      </form>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
