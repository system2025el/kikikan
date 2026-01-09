import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement } from 'react-hook-form-mui';

import { User, useUserStore } from '@/app/_lib/stores/usestore';
import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyShukeibumon, formItems } from '../_lib/datas';
import { addNewShukeibumon, getChosenShukeibumon, updateShukeibumon } from '../_lib/funcs';
import { ShukeibumonsMasterDialogSchema, ShukeibumonsMasterDialogValues } from '../_lib/types';

/**
 * 集計部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 集計部門マスタ詳細ダイアログ
 */
export const ShukeibumonsMasterDialog = ({
  user,
  shukeibumonId,
  handleClose,
  refetchShukeibumons,
}: {
  user: User | null;
  shukeibumonId: number;
  handleClose: () => void;
  refetchShukeibumons: () => void;
}) => {
  /* useState -------------------------------------- */
  /* DBのローディング状態 */
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
    resolver: zodResolver(ShukeibumonsMasterDialogSchema),
    defaultValues: {},
  });

  const isDeleted = watch('delFlg');
  const name = watch('shukeibumonNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: ShukeibumonsMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (shukeibumonId === FAKE_NEW_ID) {
      // 新規の時
      await addNewShukeibumon(data, user?.name ?? '');
      handleCloseDialog();
      setIsLoading(false);
      refetchShukeibumons();
    } else {
      // 更新の時
      if (action === 'save') {
        // 保存終了ボタン押したとき
        await updateShukeibumon(data, shukeibumonId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchShukeibumons();
      } else if (action === 'delete') {
        setIsLoading(false);
        // 削除ボタン押したとき
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateShukeibumon({ ...values, delFlg: false }, shukeibumonId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchShukeibumons();
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
    await updateShukeibumon({ ...values, delFlg: true }, shukeibumonId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    setIsLoading(false);
    await refetchShukeibumons();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneShukeibumon = async () => {
      if (shukeibumonId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyShukeibumon); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const shukeibumon1 = await getChosenShukeibumon(shukeibumonId);
        if (shukeibumon1) {
          reset(shukeibumon1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneShukeibumon();
  }, [shukeibumonId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MasterDialogTitle
        user={user}
        editable={editable}
        handleEditable={() => setEditable(true)}
        handleClose={handleClickClose}
        dialogTitle="集計部門マスタ登録"
        isNew={isNew}
        isDirty={isDirty}
        isDeleted={isDeleted!}
        push={isLoading}
        setAction={setAction}
      />
      {isLoading ? ( //DB
        <Loading />
      ) : (
        <>
          <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
            <FormBox formItem={formItems[0]} required>
              <TextFieldElement
                name="shukeibumonNam"
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
  );
};
