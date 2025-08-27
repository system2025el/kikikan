'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyAlertDialog, WillDeleteAlertDialog } from '../../_ui/dialogs';
import { emptyLoc, formItems } from '../_lib/datas';
import { addNewLoc, getOneLoc, updateLoc } from '../_lib/funcs';
import { LocsMasterDialogSchema, LocsMasterDialogValues } from '../_lib/types';

/**
 * 公演場所マスタの詳細ダイアログ
 * @param
 * @returns {JSX.Element} 公演場所マスタの詳細ダイアログコンポーネント
 */
export const LocationsMasterDialog = ({
  locationId,
  handleClose,
  refetchLocs,
}: {
  locationId: number;
  handleClose: () => void;
  refetchLocs: () => Promise<void>;
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
    defaultValues: emptyLoc,
    resolver: zodResolver(LocsMasterDialogSchema),
  });

  const isDeleted = watch('delFlg');
  const name = watch('locNam');

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: LocsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log('action is : ', action);
    console.log(data);

    if (locationId === -100) {
      // 新規の時
      await addNewLoc(data);
      handleCloseDialog();
      refetchLocs();
    } else {
      // 更新の時
      if (action === 'save') {
        // 保存終了ボタン押したとき
        await updateLoc(data, locationId);
        handleCloseDialog();
        refetchLocs();
      } else if (action === 'delete') {
        // 削除ボタン押したとき
        setDeleteOpen(true);
        return;
      } else if (action === 'restore') {
        // 有効化ボタン
        const values = await getValues();
        await updateLoc({ ...values, delFlg: false }, locationId);
        handleCloseDialog();
        refetchLocs();
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
    await updateLoc({ ...values, delFlg: true }, locationId);
    setDeleteOpen(false);
    handleCloseDialog();
    await refetchLocs();
  };

  /* useEffect --------------------------------------- */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getThatOneloc = async () => {
      if (locationId === -100) {
        // 新規追加モード
        reset(emptyLoc); // フォーム初期化
        setEditable(true); // 編集モードにする
        setIsLoading(false);
        setIsNew(true);
      } else {
        const loc1 = await getOneLoc(locationId);
        if (loc1) {
          reset(loc1); // 取得したデータでフォーム初期化
        }
        setIsLoading(false);
      }
    };
    getThatOneloc();
  }, [locationId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        <MasterDialogTitle
          editable={editable}
          isNew={isNew}
          handleEditable={() => setEditable(true)}
          handleClose={handleClickClose}
          dialogTitle={'公演場所マスタ登録'}
          isDirty={isDirty}
          isDeleted={isDeleted!}
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
                    name="locNam"
                    control={control}
                    label={editable ? formItems[0].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[1]} required>
                  <TextFieldElement
                    name="kana"
                    control={control}
                    label={editable ? formItems[1].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>

              {/* <Grid2>
                <FormBox formItem={formItems[2]}>
                  <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2> */}
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <TextFieldElement
                    name="adrPost"
                    control={control}
                    label={editable ? formItems[3].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[4]}>
                  <TextFieldElement
                    name="adrShozai"
                    control={control}
                    label={editable ? formItems[4].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[5]}>
                  <TextFieldElement
                    name="adrTatemono"
                    control={control}
                    label={editable ? formItems[5].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[6]}>
                  <TextFieldElement
                    name="adrSonota"
                    control={control}
                    label={editable ? formItems[6].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[7]}>
                  <TextFieldElement
                    name="tel"
                    control={control}
                    label={editable ? formItems[7].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[8]}>
                  <TextFieldElement
                    name="telMobile"
                    control={control}
                    label={editable ? formItems[8].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[9]}>
                  <TextFieldElement
                    name="fax"
                    control={control}
                    label={editable ? formItems[9].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[10]}>
                  <TextFieldElement
                    name="mail"
                    control={control}
                    label={editable ? formItems[10].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[11]}>
                  <TextareaAutosizeElement ////////////// 200文字までの設定をしなければならない
                    name="mem"
                    control={control}
                    label={editable ? formItems[11].exsample : ''}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[12]}>
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

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
