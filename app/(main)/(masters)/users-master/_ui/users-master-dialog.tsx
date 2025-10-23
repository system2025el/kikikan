'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { RadioButtonGroup, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyUser, formItems, radioPair, radioTrio } from '../_lib/datas';
import { addNewUser, getChosenUser, updateUser } from '../_lib/funcs';
import { UsersMasterDialogValues, UsersMaterDialogSchema } from '../_lib/types';
/**
 * 担当者マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 担当者マスタの詳細ダイアログコンポーネント
 */
export const UsersMasterDialog = ({
  mailAdr,
  handleClose,
  refetchUsers,
}: {
  mailAdr: string;
  handleClose: () => void;
  refetchUsers: () => void;
}) => {
  // ログインユーザ
  const user = useUserStore((state) => state.user);

  /* useState --------------------- */
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
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
    defaultValues: {},
    resolver: zodResolver(UsersMaterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const name = watch('tantouNam');

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: UsersMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (mailAdr === String(FAKE_NEW_ID)) {
      // await addNewUser(data);
      handleCloseDialog();
      refetchUsers();
    } else {
      if (action === 'save') {
        // await updateUser(data, userId);
        handleCloseDialog();
        refetchUsers();
      } else if (action === 'delete') {
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        // await updateUser({ ...values, delFlg: false }, userId);
        handleCloseDialog();
        refetchUsers();
      }
    }
  };

  /* 詳細ダイアログを閉じる */
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
    const values = await getValues();
    // await updateUser({ ...values, delFlg: true }, userId);
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchUsers();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneUser = async () => {
      if (mailAdr && mailAdr !== String(FAKE_NEW_ID)) {
        const user1 = await getChosenUser(mailAdr);
        if (user1) {
          reset(user1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneUser();
  }, [mailAdr]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'担当者マスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
          isDeleted={isDeleted!}
          setAction={setAction}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="tantouNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[1]} required>
                <TextFieldElement
                  name="mailAdr"
                  control={control}
                  label={editable ? formItems[1].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  name="shainCod"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>

              <FormBox formItem={formItems[3]} required align="baseline">
                <Grid2 container direction={'column'} spacing={1} p={0.5}>
                  <Grid2 sx={styles.container}>
                    <Typography mr={8}>受注系画面</Typography>
                    <RadioButtonGroup
                      name="psermission.juchu"
                      control={control}
                      options={radioTrio}
                      disabled={editable ? false : true}
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={6}>入出庫系画面</Typography>

                    <RadioButtonGroup
                      name="psermission.nyushuko"
                      control={control}
                      options={radioTrio}
                      disabled={editable ? false : true}
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={2}>業務マスタ系画面</Typography>
                    <RadioButtonGroup
                      name="psermission.masters"
                      control={control}
                      options={radioTrio}
                      disabled={editable ? false : true}
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={6}>ログイン管理</Typography>
                    <RadioButtonGroup
                      name="psermission.loginSetting"
                      control={control}
                      options={radioPair}
                      disabled={editable ? false : true}
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={6}>ハンディ作業</Typography>
                    <RadioButtonGroup
                      name="psermission.ht"
                      control={control}
                      options={radioPair}
                      disabled={editable ? false : true}
                      row
                    />
                  </Grid2>
                </Grid2>
              </FormBox>
              <FormBox formItem={formItems[4]}>
                <TextFieldElement
                  name="mem"
                  control={control}
                  label={editable ? formItems[4].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[5]}>
                <TextFieldElement name="lastLoginAt" control={control} sx={{ maxWidth: '90%' }} disabled />
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
              handleCloseDelete={() => setDeleteOpen(false)}
              handleCloseAll={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {
  container: { display: 'flex', alignItems: 'center' },
};
