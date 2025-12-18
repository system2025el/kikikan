import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { FormBox } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { FAKE_NEW_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyBase, formItems } from '../_lib/datas';
import { addNewBase, getChosenBase, updateBase } from '../_lib/funcs';
import { BasesMasterDialogSchema, BasesMasterDialogValues } from '../_lib/types';

/**
 * 拠点マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 拠点マスタ詳細ダイアログコンポーネント
 */
export const BasesMasterDialog = ({
  baseId,
  handleClose,
  refetchBases,
}: {
  baseId: number;
  handleClose: () => void;
  refetchBases: () => void;
}) => {
  const user = useUserStore((state) => state.user);
  /* useState -------------------------------------- */
  /* 拠点 */
  /* 新規作成かどうか */
  const [isNew, setIsNew] = useState(false);
  /* 未保存ダイアログ出すかどうか */
  const [dirtyOpen, setDirtyOpen] = useState(false);
  /* DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログでの編集モードかどうか */
  const [editable, setEditable] = useState(false);
  /* 削除フラグ確認ダイアログ出すかどうか */
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* submit時のactions (save, delete) */
  const [action, setAction] = useState<'save' | 'delete' | 'restore' | undefined>(undefined);

  /* useForm ----------------------------------------- */
  const {
    formState: { isDirty },
    control,
    handleSubmit,
    reset,
    watch,
    getValues,
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(BasesMasterDialogSchema),
    defaultValues: emptyBase,
  });

  const isDeleted = watch('delFlg');
  const name = watch('shozokuNam');

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: BasesMasterDialogValues) => {
    setIsLoading(true);
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (baseId === FAKE_NEW_ID) {
      // 新規登録
      await addNewBase(data, user?.name ?? '');
      handleCloseDialog();
      setIsLoading(false);
      refetchBases();
    } else {
      // 更新
      if (action === 'save') {
        // 保存ボタン
        await updateBase(data, baseId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchBases();
      } else if (action === 'delete') {
        setIsLoading(false);
        // 削除ボタン
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateBase({ ...values, delFlg: false }, baseId, user?.name ?? '');
        handleCloseDialog();
        setIsLoading(false);
        refetchBases();
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
    await updateBase({ ...values, delFlg: true }, baseId, user?.name ?? '');
    setDeleteOpen(false);
    handleCloseDialog();
    setIsLoading(false);
    await refetchBases();
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneBase = async () => {
      if (baseId === FAKE_NEW_ID) {
        // 新規追加モード
        reset(emptyBase); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const base1 = await getChosenBase(baseId);
        if (base1) {
          reset(base1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneBase();
  }, [baseId, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <MasterDialogTitle
        editable={editable}
        handleEditable={() => setEditable(true)}
        handleClose={handleClickClose}
        dialogTitle="所属マスタ登録"
        isDirty={isDirty}
        isNew={isNew}
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
                name="shozokuNam"
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
