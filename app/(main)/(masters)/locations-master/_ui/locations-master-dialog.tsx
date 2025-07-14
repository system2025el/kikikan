'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Grid2 } from '@mui/material';
import { JSX, SetStateAction, useEffect, useState } from 'react';
import { CheckboxElement, TextareaAutosizeElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormBox } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

import { MasterDialogTitle } from '../../_ui/dialog-title';
import { IsDirtyDialog } from '../../_ui/isdirty-dialog';
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
  /* submit時のactions (save,) */
  const [action, setAction] = useState<'save' | 'delete' | undefined>(undefined);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, dirtyFields },
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      // locId: -100,
      locNam: '',
      adrPost: '',
      adrShozai: '',
      adrTatemono: '',
      adrSonota: '',
      tel: '',
      fax: '',
      mem: '',
      kana: '',
      dspFlg: true,
      telMobile: '',
      delFlg: false,
    },
    resolver: zodResolver(LocsMasterDialogSchema),
  });

  /* methods ---------------------------- */
  /* フォームを送信 */
  const onSubmit = async (data: LocsMasterDialogValues) => {
    console.log('isDarty : ', isDirty);
    console.log('action is : ', action);
    console.log(data);
    if (locationId === -100) {
      await addNewLoc(data);
    } else {
      if (action === 'save') {
        await updateLoc(data, locationId);
      } else if (action === 'delete') {
        await updateLoc({ ...data, delFlg: true }, locationId);
      }
    }
    handleCloseDialog();
    refetchLocs();
  };

  /* 詳細ダイアログを閉じる */
  const handleCloseDialog = () => {
    setEditable(false);
    setIsNew(false);
    handleClose();
  };

  /* 未保存ダイアログを閉じる */
  const handleCloseDirty = () => {
    setDirtyOpen(false);
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
                    label={formItems[0].exsample}
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
                    label={formItems[1].exsample}
                    fullWidth
                    sx={{ maxWidth: '90%' }}
                    disabled={editable ? false : true}
                  />
                </FormBox>
              </Grid2>

              <Grid2>
                <FormBox formItem={formItems[2]}>
                  <CheckboxElement name="delFlg" control={control} size="medium" disabled={editable ? false : true} />
                </FormBox>
              </Grid2>
              <Grid2>
                <FormBox formItem={formItems[3]}>
                  <TextFieldElement
                    name="adrPost"
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
                  <TextFieldElement
                    name="adrShozai"
                    control={control}
                    label={formItems[4].exsample}
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
                    label={formItems[5].exsample}
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
                    label={formItems[6].exsample}
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
                    label={formItems[7].exsample}
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
                    label={formItems[8].exsample}
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
                    label={formItems[9].exsample}
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
                    label={formItems[10].exsample}
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
                    label={formItems[11].exsample}
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
            <IsDirtyDialog open={dirtyOpen} handleCloseDirty={handleCloseDirty} handleCloseAll={handleCloseDialog} />
          </>
        )}
      </form>
    </>
  );
};

/** ---------------------------スタイル----------------------------- */
const styles: { [key: string]: React.CSSProperties } = {};
