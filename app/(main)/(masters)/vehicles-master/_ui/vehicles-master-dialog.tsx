import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { JSX, useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '../../../_ui/form-box';
import { Loading } from '../../../_ui/loading';
import { NEW_MASTER_ID } from '../../_lib/constants';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyVeh, formItems } from '../_lib/datas';
import { addNewVeh, getChosenVeh, updateVeh } from '../_lib/funcs';
import { VehsMasterDialogSchema, VehsMasterDialogValues } from '../_lib/types';
/**
 * 車両マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 車両マスタの詳細ダイアログのコンポーネント
 */
export const VehiclesMasterDialog = ({
  vehicleId,
  handleClose,
  refetchVehs,
}: {
  vehicleId: number;
  handleClose: () => void;
  refetchVehs: () => Promise<void>;
}) => {
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

  /* useForm ------------------------ */
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
    resolver: zodResolver(VehsMasterDialogSchema),
    defaultValues: {},
  });

  const isDeleted = watch('delFlg');
  const name = watch('sharyoNam');

  /* methods ---------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: VehsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    if (vehicleId === NEW_MASTER_ID) {
      await addNewVeh(data);
      handleCloseDialog();
      refetchVehs();
    } else {
      if (action === 'save') {
        await updateVeh(data, vehicleId);
        handleCloseDialog();
        refetchVehs();
      } else if (action === 'delete') {
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateVeh({ ...values, delFlg: false }, vehicleId);
        handleCloseDialog();
        refetchVehs();
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
    await updateVeh({ ...values, delFlg: true }, vehicleId);
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchVehs();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneVeh = async () => {
      if (vehicleId === NEW_MASTER_ID) {
        // 新規追加モード
        reset(emptyVeh); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const Veh1 = await getChosenVeh(vehicleId);
        if (Veh1) {
          reset(Veh1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneVeh();
  }, [vehicleId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'車両マスタ登録'}
          isNew={isNew}
          isDirty={isDirty}
          isDeleted={isDeleted!}
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
                    name="sharyoNam"
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
                  <TextFieldElement
                    multiline
                    name="mem"
                    control={control}
                    label={editable ? formItems[2].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <CheckboxElement name="dspFlg" control={control} size="medium" disabled={editable ? false : true} />
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
