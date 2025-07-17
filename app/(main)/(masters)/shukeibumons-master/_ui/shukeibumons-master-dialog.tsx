import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement } from 'react-hook-form-mui';

import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyShukeibumon, formItems } from '../_lib/datas';
import { addNewShukeibumon, getOneShukeibumon, updateShukeibumon } from '../_lib/funcs';
import { ShukeibumonsMasterDialogSchema, ShukeibumonsMasterDialogValues } from '../_lib/types';

/**
 * 集計部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 集計部門マスタ詳細ダイアログ
 */
export const ShukeibumonsMasterDialog = ({
  shukeibumonId,
  handleClose,
  refetchShukeibumons,
}: {
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
  const [action, setAction] = useState<'save' | 'delete' | undefined>(undefined);

  /* useForm ----------------------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
    getValues,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(ShukeibumonsMasterDialogSchema),
    defaultValues: {},
  });
  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: ShukeibumonsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (shukeibumonId === -100) {
      // 新規の時
      await addNewShukeibumon(data);
      handleCloseDialog();
      refetchShukeibumons();
    } else {
      // 更新の時
      if (action === 'save') {
        // 保存終了ボタン押したとき
        await updateShukeibumon(data, shukeibumonId);
        handleCloseDialog();
        refetchShukeibumons();
      } else if (action === 'delete') {
        // 削除ボタン押したとき
        setDeleteOpen(true);
        return;
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
    await updateShukeibumon({ ...values, delFlg: true }, shukeibumonId);
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchShukeibumons();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneShukeibumon = async () => {
      if (shukeibumonId === -100) {
        // 新規追加モード
        reset(emptyShukeibumon); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const shukeibumon1 = await getOneShukeibumon(shukeibumonId);
        if (shukeibumon1) {
          reset(shukeibumon1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneShukeibumon();
  }, [shukeibumonId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="集計部門マスタ登録"
          isNew={isNew}
          isDirty={isDirty}
          setAction={setAction}
        />
        {isLoading ? ( //DB
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required>
                  <TextFieldElement
                    name="shukeibumonNam"
                    control={control}
                    label={formItems[0].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <TextareaAutosizeElement
                    name="mem"
                    control={control}
                    label={formItems[2].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
            </Grid2>
            <IsDirtyAlertDialog
              open={dirtyOpen}
              handleCloseDirty={() => setDirtyOpen(false)}
              handleCloseAll={handleCloseDialog}
            />
            <WillDeleteAlertDialog
              open={deleteOpen}
              handleCloseDelete={() => setDeleteOpen(false)}
              handleCloseAll={handleConfirmDelete}
            />
          </>
        )}
      </form>
    </>
  );
};
