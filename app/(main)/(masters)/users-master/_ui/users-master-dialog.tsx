'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle, Grid2, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { RadioButtonGroup, TextFieldElement, useForm } from 'react-hook-form-mui';

import { checkMailAdr, checkShainCod, selectActiveUsers } from '@/app/_lib/db/tables/m-user';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import {
  emptyUser,
  formItems,
  htRadio,
  juchuRadio,
  loginSettingRadio,
  mastersRadio,
  nyushukoRadio,
  radioPair,
  radioTrio,
} from '../_lib/datas';
import {
  addNewUser,
  deleteUsers,
  getChosenUser,
  restoreUsers,
  restoreUsersAndShainCod,
  updateUser,
} from '../_lib/funcs';
import { UsersMasterDialogValues, UsersMaterDialogSchema } from '../_lib/types';
/**
 * 担当者マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 担当者マスタの詳細ダイアログコンポーネント
 */
export const UsersMasterDialog = ({
  currentMailAdr,
  handleClose,
  refetchUsers,
}: {
  currentMailAdr: string;
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
  const [isNew, setIsNew] = useState<boolean>(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState<boolean>(false);
  /* 削除フラグ確認ダイアログ出すかどうか */
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  /* 有効化確認ダイアログ */
  const [restoreOpen, setRestoreOpen] = useState<boolean>(false);
  /* 有効処理中 */
  const [willRestore, setWillRestore] = useState<boolean>(false);
  /* submit時のactions (save, delete) */
  const [action, setAction] = useState<'save' | 'delete' | 'restore' | undefined>(undefined);
  /* メアドのエラーメッセージ */
  const [adrErrorMsg, setAdrErrorMsg] = useState<string | null>(null);
  /* 社員コードのエラーメッセージ */
  const [codErrorMsg, setCodErrorMsg] = useState<string | null>(null);
  /* 元の社員番号 */
  const [currentShainCod, setCurrentShainCod] = useState<string | null>(null);

  /* useForm ------------------------- */
  const {
    control,
    formState: { isDirty },
    watch,
    handleSubmit,
    reset,
    setValue,
    getValues,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: emptyUser,
    resolver: zodResolver(UsersMaterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const mail = watch('mailAdr');

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: UsersMasterDialogValues) => {
    setIsLoading(true);

    setCodErrorMsg(null);
    setAdrErrorMsg(null);
    if (currentMailAdr === String(FAKE_NEW_ID)) {
      // 新規処理
      // メールアドレスと社員コードの重複確認
      const adr = await checkMailAdr(data.mailAdr);
      if (adr.data) {
        setAdrErrorMsg('既に使われているメールアドレスです');
        setIsLoading(false);

        if (data.shainCod) {
          const cod = await checkShainCod(data.shainCod);
          if (cod.data) {
            setCodErrorMsg(`既に使われている社員コードです`);
            setIsLoading(false);
          }
          if (!adr.data && !cod.data) {
            await addNewUser(data, user?.name ?? '');
            handleCloseDialog();
            setIsLoading(false);
            refetchUsers();
          }
        }
      } else {
        await addNewUser(data, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchUsers();
      }
    } else {
      // 更新処理
      if (action === 'save') {
        if (willRestore) {
          // 有効化処理
          if (data.shainCod) {
            const cod = await checkShainCod(data.shainCod);
            if (cod.data) {
              setCodErrorMsg(`既に使われている社員コードです`);
              setIsLoading(false);
              setEditable(true);
            } else {
              setIsLoading(false);
              setRestoreOpen(true);
            }
          } else {
            setIsLoading(false);
            setRestoreOpen(true);
          }
        } else {
          // 保存処理
          if (data.shainCod && data.shainCod !== currentShainCod) {
            const cod = await checkShainCod(data.shainCod);
            if (cod.data) {
              setCodErrorMsg(`既に使われている社員コードです`);
              setEditable(true);
              setIsLoading(false);
            } else {
              await updateUser(currentMailAdr, data, user?.name ?? '');
              handleCloseDialog();
              setIsLoading(false);
              refetchUsers();
            }
          } else {
            await updateUser(currentMailAdr, data, user?.name ?? '');
            handleCloseDialog();
            setIsLoading(false);
            refetchUsers();
          }
        }
      } else if (action === 'delete') {
        setIsLoading(false);
        // 無効化
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化
        // 社員コードの重複確認
        if (currentShainCod) {
          const cod = await checkShainCod(currentShainCod);
          if (cod.data) {
            setCodErrorMsg(`既に使われている社員コードです`);
            setValue('delFlg', false);
            setWillRestore(true);
            setIsLoading(false);
          } else {
            setIsLoading(false);
            setRestoreOpen(true);
          }
        }
        if (!currentShainCod) {
          setIsLoading(false);
          setRestoreOpen(true);
        }
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

  /* 無効化確認ダイアログで無効化選択時 */
  const handleConfirmDelete = async () => {
    setIsLoading(true);
    await deleteUsers(currentMailAdr, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    setIsLoading(false);
    await refetchUsers();
  };

  /* 有効か確認ダイアログで有効化選択時 */
  const handleConfirmRestore = async () => {
    setIsLoading(true);
    if (willRestore) {
      const shainCod = getValues('shainCod');
      await restoreUsersAndShainCod(currentMailAdr, shainCod ?? null, user?.name ?? '');
      setRestoreOpen(false);
      handleCloseDialog();
      setIsLoading(false);
      await refetchUsers();
    } else {
      await restoreUsers(currentMailAdr, user?.name ?? '');
      setRestoreOpen(false);
      handleCloseDialog();
      setIsLoading(false);
      await refetchUsers();
    }
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneUser = async () => {
      if (currentMailAdr === String(FAKE_NEW_ID)) {
        // 新規追加モード
        reset(emptyUser); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const user1 = await getChosenUser(currentMailAdr);
        if (user1) {
          reset(user1); // 取得したデータでフォーム初期化
          setCurrentShainCod(user1.shainCod ?? null);
        }
        setIsLoading(false);
      }
    };
    getThatOneUser();
  }, [currentMailAdr, reset]);

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
          push={isLoading}
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
                  disabled={!editable || !isNew}
                  error={!!adrErrorMsg}
                  helperText={adrErrorMsg}
                  slotProps={{
                    formHelperText: {
                      sx: (theme) => ({
                        color: theme.palette.error.main,
                      }),
                    },
                  }}
                  type="email"
                />
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  name="shainCod"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  sx={{ width: 120 }}
                  disabled={editable || willRestore ? false : true}
                  error={!!codErrorMsg}
                  helperText={codErrorMsg}
                  slotProps={{
                    formHelperText: {
                      sx: (theme) => ({
                        color: theme.palette.error.main,
                      }),
                    },
                  }}
                />
              </FormBox>

              <FormBox formItem={formItems[3]} required align="baseline">
                <Grid2 container direction={'column'} spacing={1} p={0.5}>
                  <Grid2 sx={styles.container}>
                    <Typography mr={8}>受注系画面</Typography>
                    <RadioButtonGroup
                      name="psermission.juchu"
                      control={control}
                      options={juchuRadio}
                      valueKey="id"
                      disabled={editable ? false : true}
                      type="number"
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={6}>入出庫系画面</Typography>

                    <RadioButtonGroup
                      name="psermission.nyushuko"
                      control={control}
                      options={nyushukoRadio}
                      valueKey="id"
                      disabled={editable ? false : true}
                      type="number"
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={2}>業務マスタ系画面</Typography>
                    <RadioButtonGroup
                      name="psermission.masters"
                      control={control}
                      options={mastersRadio}
                      valueKey="id"
                      disabled={editable ? false : true}
                      type="number"
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={6}>ログイン管理</Typography>
                    <RadioButtonGroup
                      name="psermission.loginSetting"
                      control={control}
                      options={loginSettingRadio}
                      valueKey="id"
                      disabled={editable ? false : true}
                      type="number"
                      row
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography mr={6}>ハンディ作業</Typography>
                    <RadioButtonGroup
                      name="psermission.ht"
                      control={control}
                      options={htRadio}
                      valueKey="id"
                      disabled={editable ? false : true}
                      type="number"
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
            {/* 無効化・認証情報削除確認ダイアログ */}
            <Dialog open={deleteOpen}>
              <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
                <WarningIcon color="error" />
                <Box>無効化</Box>
              </DialogTitle>
              <DialogContentText m={2}>
                {mail}が無効化されます
                <br />
                {mail}の認証情報が削除され、ログインできなくなります
              </DialogContentText>
              <DialogActions>
                <Button color="error" onClick={() => handleConfirmDelete()} loading={isLoading}>
                  無効化
                </Button>
                <Button onClick={() => setDeleteOpen(false)}>戻る</Button>
              </DialogActions>
            </Dialog>
            {/* 有効化・認証メール送信確認ダイアログ */}
            <Dialog open={restoreOpen}>
              <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
                <WarningIcon color="error" />
                <Box>有効化</Box>
              </DialogTitle>

              <DialogContentText m={5}>
                {mail}が有効化されます
                <br />
                {mail}に届いたメールから
                <br />
                承認とログインを行ってください
              </DialogContentText>
              <DialogActions>
                <Button color="error" onClick={() => handleConfirmRestore()} loading={isLoading}>
                  有効化
                </Button>
                <Button onClick={() => setRestoreOpen(false)}>戻る</Button>
              </DialogActions>
            </Dialog>
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
