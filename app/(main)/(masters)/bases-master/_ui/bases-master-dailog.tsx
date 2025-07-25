import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { SetStateAction, useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox, FormItemsType } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyBase, formItems } from '../_lib/datas';
import { addNewBase, getOneBase, updateBase } from '../_lib/funcs';
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
    resolver: zodResolver(BasesMasterDialogSchema),
    defaultValues: emptyBase,
  });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: BasesMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (baseId === -100) {
      // 新規登録
      await addNewBase(data);
      handleCloseDialog();
      refetchBases();
    } else {
      // 更新
      if (action === 'save') {
        // 保存ボタン
        await updateBase(data, baseId);
        handleCloseDialog();
        refetchBases();
      } else if (action === 'delete') {
        // 削除ボタン
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
    await updateBase({ ...values, delFlg: true }, baseId);
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchBases();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneBase = async () => {
      if (baseId === -100) {
        // 新規追加モード
        reset(emptyBase); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const base1 = await getOneBase(baseId);
        if (base1) {
          reset(base1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneBase();
  }, [baseId]);
  /* eslint-enable react-hooks/exhaustive-deps */
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle="所属マスタ登録"
          isDirty={isDirty}
          isNew={isNew}
          setAction={setAction}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required={true}>
                  <TextFieldElement
                    name="shozokuNam"
                    control={control}
                    label={editable ? formItems[0].exsample : ''}
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
                    label={editable ? formItems[2].exsample : ''}
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
