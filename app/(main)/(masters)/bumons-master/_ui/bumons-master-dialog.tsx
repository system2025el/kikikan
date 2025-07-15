import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  SelectElement,
  TextareaAutosizeElement,
  TextFieldElement,
  useForm,
} from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';

import { FormBox } from '../../../_ui/form-box';
import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyBumon, formItems } from '../_lib/datas';
import { BumonsMasterDialogSchema, BumonsMasterDialogValues } from '../_lib/types';
// import { Loading } from '../../../_ui/loading';

/**
 * 部門マスタ詳細ダイアログ
 * @param
 * @returns {JSX.Element} 部門マスタ詳細ダイアログコンポーネント
 */
export const BumonsMasterDialog = ({
  bumonId,
  handleClose,
  refetchBumons,
}: {
  bumonId: number;
  handleClose: () => void;
  refetchBumons: () => void;
}) => {
  /* useState -------------------------------------- */
  /* 部門 */
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
    resolver: zodResolver(BumonsMasterDialogSchema),
    defaultValues: {},
  });

  /* methods ---------------------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: BumonsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log(data);
    // if (bumonId === -100) {
    //   await addNewBumon(data);  // handleCloseDialog();
    // refetchBumons();
    // } else {
    // if (action === 'save') {
    //   await updateBumon(data, bumonId);
    // handleCloseDialog();
    // refetchBumons();
    // } else if (action === 'delete') {
    //   setDeleteOpen(true);
    //   return;
    // }
    // }
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
    // const values = await getValues();
    // await updateBumon({ ...values, delFlg: true }, bumonId);
    setDeleteOpen(false);
    handleCloseDialog();
    // await refetchBumons();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOnebumon = async () => {
      if (bumonId === -100) {
        // 新規追加モード
        reset(emptyBumon); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        // const bumon1 = await getOnebumon(bumonId);
        // if (bumon1) {
        //   setbumon(bumon1);
        //   reset(bumon1); // 取得したデータでフォーム初期化
        // }
        setIsLoading(false);
      }
    };
    getThatOnebumon();
  }, [bumonId]);
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
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <Grid2 container spacing={1} p={5} direction={'column'} justifyContent={'center'} width={'100%'}>
              <Grid2>
                <FormBox formItem={formItems[0]} required>
                  <TextFieldElement
                    name="bumonNam"
                    control={control}
                    label={formItems[0].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              {/* <Grid2>
                <FormBox formItem={formItems[1]}>
                  <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2> */}
              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                    name="mem"
                    control={control}
                    label={formItems[2].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <SelectElement
                    name="daibumonId"
                    control={control}
                    label={formItems[3].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[4]}>
                  <SelectElement
                    name="shukeibumonId"
                    control={control}
                    label={formItems[4].exsample}
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
