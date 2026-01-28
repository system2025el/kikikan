import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2, Snackbar } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { User, useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyDaibumon, formItems } from '../_lib/datas';
import { addNewDaibumon, getChosenDaibumon, updateDaibumon } from '../_lib/funcs';
import { DaibumonsMasterDialogSchema, DaibumonsMasterDialogValues } from '../_lib/types';

/**
 * 大部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 大部門マスタ詳細ダイアログコンポーネント
 */
export const DaibumonsMasterDialog = ({
  user,
  daibumonId,
  handleClose,
  refetchDaibumons,
}: {
  user: User | null;
  daibumonId: number;
  handleClose: () => void;
  refetchDaibumons: () => void;
}) => {
  /* useState -------------------------------------- */
  /* DBのローディング状態 */
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

  /* useForm ----------------------------------------- */
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
    resolver: zodResolver(DaibumonsMasterDialogSchema),
    defaultValues: emptyDaibumon,
  });

  const isDeleted = watch('delFlg');
  const name = watch('daibumonNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: DaibumonsMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (daibumonId === FAKE_NEW_ID) {
      try {
        await addNewDaibumon(data, user?.name ?? '');
      } catch (e) {
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
        return;
      } finally {
        setIsLoading(false);
      }
      handleCloseDialog();
      refetchDaibumons();
    } else {
      if (action === 'save') {
        try {
          await updateDaibumon(data, daibumonId, user?.name ?? '');
        } catch (e) {
          setSnackBarMessage('保存に失敗しました');
          setSnackBarOpen(true);
          return;
        } finally {
          setIsLoading(false);
        }
        handleCloseDialog();
        refetchDaibumons();
      } else if (action === 'delete') {
        setIsLoading(false);
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        try {
          await updateDaibumon({ ...values, delFlg: false }, daibumonId, user?.name ?? '');
        } catch (e) {
          setSnackBarMessage('有効化に失敗しました');
          setSnackBarOpen(true);
          return;
        } finally {
          setIsLoading(false);
        }
        handleCloseDialog();
        refetchDaibumons();
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
    setIsLoading(true);
    const values = await getValues();
    try {
      await updateDaibumon({ ...values, delFlg: true }, daibumonId, user?.name ?? '');
    } catch (e) {
      setSnackBarMessage('無効化に失敗しました');
      setSnackBarOpen(true);
      return;
    } finally {
      setDeleteOpen(false);
      setIsLoading(false);
    }
    handleCloseDialog();
    await refetchDaibumons();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneDaibumon = async () => {
      if (daibumonId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyDaibumon); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        try {
          const daibumon1 = await getChosenDaibumon(daibumonId);
          if (daibumon1) {
            reset(daibumon1); // 取得したデータでフォーム初期化
            // }
          }
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
        }
        setIsLoading(false);
      }
    };
    getThatOneDaibumon();
  }, [daibumonId, reset]);

  if (error) throw error;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          user={user}
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="大部門マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          push={isLoading}
          setAction={setAction}
          isDeleted={isDeleted!}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <FormBox formItem={formItems[0]} required>
                <TextFieldElement
                  name="daibumonNam"
                  control={control}
                  label={editable ? formItems[0].exsample : ''}
                  fullWidth
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
              </FormBox>
              <FormBox formItem={formItems[2]}>
                <TextFieldElement
                  multiline
                  name="mem"
                  control={control}
                  label={editable ? formItems[2].exsample : ''}
                  fullWidth
                  minRows={3}
                  maxRows={3}
                  sx={{ maxWidth: '90%' }}
                  disabled={editable ? false : true}
                />
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
